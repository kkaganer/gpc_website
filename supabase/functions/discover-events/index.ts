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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get current date for the prompt
    const now = new Date()
    const twoWeeksOut = new Date(now)
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
    const fromDate = now.toISOString().split('T')[0]
    const toDate = twoWeeksOut.toISOString().split('T')[0]

    const prompt = `Today is ${fromDate}. Find family-friendly events in London happening ONLY between ${fromDate} and ${toDate}. EVERY event must be on or after ${fromDate} — do NOT include past events.

Search these sources: Eventbrite London family events, Time Out London kids section, Kidrated, visitgreenwich.org.uk, Royal Museums Greenwich (National Maritime Museum, Cutty Sark), Horniman Museum, Mudchute Farm, Greenwich Theatre, The Albany Deptford, Greenwich/Lewisham/Southwark council event pages.

Focus on SE London (Greenwich, Lewisham, Southwark, Deptford, Blackheath, Woolwich, Eltham, Bromley) but include notable London-wide family events too.

Include a mix of: museum activities, theatre, outdoor events, craft workshops, baby/toddler groups, sports, food markets, seasonal activities.

Return a JSON array of 15-20 events. Each event object must have:
- title: event name
- venue: place name (e.g. "Horniman Museum")
- date: YYYY-MM-DD (must be ${fromDate} to ${toDate})
- time: e.g. "10:00 - 14:00" or null
- location: address or area
- area: "Greenwich" | "Lewisham" | "Southwark" | "Central London" | "Tower Hamlets" | "Bromley"
- lat: number (e.g. 51.4769)
- lng: number (e.g. -0.0005)
- description: 1-2 sentences
- url: direct link to event page
- category: "Family" | "Outdoor" | "Arts" | "Sports" | "Music" | "Food"
- age_range: e.g. "All ages", "0-5"
- price: e.g. "Free", "£5"
- is_free: true/false

Return ONLY a valid JSON array. No markdown, no explanation.`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search' }],
        input: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds local events. Always respond with valid JSON arrays only, no markdown or extra text.',
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

    // Debug: log the output structure
    const outputTypes = (result.output || []).map((item: any) => item.type)
    console.log('OpenAI output types:', JSON.stringify(outputTypes))

    // Extract text from the message in the Responses API output
    // Use filter instead of findLast for Deno compatibility
    const messages = (result.output || []).filter((item: any) => item.type === 'message')
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No message found in OpenAI response',
          debug: { outputTypes, outputLength: (result.output || []).length, rawKeys: Object.keys(result) },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const content = lastMessage.content?.[0]?.text || ''

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No text content in message',
          debug: { messageKeys: Object.keys(lastMessage), contentArray: lastMessage.content },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the JSON from the response (handle potential markdown code blocks)
    let events: any[]
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      events = JSON.parse(cleaned)
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response as JSON',
          debug: { contentPreview: content.substring(0, 500) },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'AI response is not an array',
          debug: { type: typeof events },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert events as pending (approved = false)
    let inserted = 0
    const insertErrors: string[] = []
    for (const event of events) {
      if (!event.title || !event.date || !event.location) continue

      const { error } = await supabase.from('london_events').insert({
        title: event.title,
        venue: event.venue || null,
        date: event.date,
        time: event.time || null,
        location: event.location,
        area: event.area || null,
        lat: typeof event.lat === 'number' ? event.lat : null,
        lng: typeof event.lng === 'number' ? event.lng : null,
        description: event.description || null,
        url: event.url || null,
        category: event.category || null,
        age_range: event.age_range || null,
        price: event.price || null,
        is_free: event.is_free ?? (event.price?.toLowerCase() === 'free'),
        source: 'openai',
        approved: false,
      })

      if (error) {
        insertErrors.push(`${event.title}: ${error.message}`)
      } else {
        inserted++
      }
    }

    return new Response(
      JSON.stringify({ success: true, discovered: events.length, inserted, insertErrors: insertErrors.length > 0 ? insertErrors : undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
