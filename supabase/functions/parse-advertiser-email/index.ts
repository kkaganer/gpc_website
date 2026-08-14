import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }

    const { emailText } = await req.json()
    if (!emailText || typeof emailText !== 'string') {
      throw new Error('emailText is required')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const prompt = `Extract advertiser event requests from this email thread. The email is from an advertiser asking to have their events included in a weekly newsletter (sent every Friday).

For each event mentioned, extract:
- advertiser_name: the company/person requesting (look at the email signature or who they represent)
- contact_email: their email address
- event_title: the name of the event they want advertised
- event_description: any description or details about the event (if provided)
- event_url: any URL/link for the event (if provided)
- newsletter_date: the Friday date (YYYY-MM-DD) of the newsletter they want it in. If they say a month like "April", use the first Friday of that month. If unclear, use the next upcoming Friday from today (${new Date().toISOString().split('T')[0]}).

Return a JSON array of objects. Each object = one event to advertise. If multiple events are mentioned for different months, create separate entries.

EMAIL:
${emailText}

Return ONLY a valid JSON array. No markdown, no explanation.`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured data from emails. Always respond with valid JSON arrays only, no markdown or extra text.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    // Extract text from the message
    const messages = (result.output || []).filter((item: any) => item.type === 'message')
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage) {
      throw new Error('No message found in OpenAI response')
    }

    const content = lastMessage.content?.[0]?.text || ''
    if (!content) {
      throw new Error('No text content in response')
    }

    let entries: any[]
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      entries = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse AI response as JSON')
    }

    if (!Array.isArray(entries)) {
      throw new Error('AI response is not an array')
    }

    // Insert as pending advertisers
    let inserted = 0
    const insertErrors: string[] = []
    for (const entry of entries) {
      if (!entry.advertiser_name || !entry.event_title || !entry.newsletter_date) continue

      const { error } = await supabase.from('newsletter_advertisers').insert({
        advertiser_name: entry.advertiser_name,
        contact_email: entry.contact_email || null,
        event_title: entry.event_title,
        event_description: entry.event_description || null,
        event_url: entry.event_url || null,
        newsletter_date: entry.newsletter_date,
        ad_type: 'free-listing',
        status: 'pending',
        notes: null,
      })

      if (error) {
        insertErrors.push(`${entry.event_title}: ${error.message}`)
      } else {
        inserted++
      }
    }

    return new Response(
      JSON.stringify({ success: true, parsed: entries.length, inserted, insertErrors: insertErrors.length > 0 ? insertErrors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
