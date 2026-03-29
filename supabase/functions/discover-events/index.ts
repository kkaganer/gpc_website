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
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY')
    if (!perplexityKey) {
      throw new Error('PERPLEXITY_API_KEY is not configured')
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

    const prompt = `Find family-friendly events happening in London between ${fromDate} and ${toDate}. Focus especially on Greenwich, Lewisham, Southwark, and South East London areas, but also include notable London-wide events.

Check these sources specifically:
- Eventbrite London family events
- Time Out London families section
- Kidrated
- Greenwich.co.uk events
- Little Day Out London
- Mumsnet local events
- Local council event listings (Royal Borough of Greenwich, Lewisham Council)

For each event, provide this information in a JSON array:
- title: event name
- venue: venue/place name (e.g. "National Maritime Museum", "Greenwich Park")
- date: YYYY-MM-DD format
- time: start-end time if available (e.g. "10:00 - 14:00")
- location: full address or area description
- area: one of "Greenwich", "Lewisham", "Southwark", "Central London", "Tower Hamlets", "Bromley", or the most relevant London area
- lat: latitude as a number (e.g. 51.4769)
- lng: longitude as a number (e.g. -0.0005)
- description: 1-2 sentence description
- url: link to the event page
- category: one of "Family", "Outdoor", "Arts", "Sports", "Music", "Food"
- age_range: e.g. "0-5", "5-12", "All ages"
- price: the price or "Free"
- is_free: true/false

Return ONLY a valid JSON array with no additional text. Aim for 10-20 events.`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds local events. Always respond with valid JSON arrays only, no markdown or extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || '[]'

    // Parse the JSON from the response (handle potential markdown code blocks)
    let events: any[]
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      events = JSON.parse(cleaned)
    } catch {
      throw new Error('Failed to parse AI response as JSON')
    }

    if (!Array.isArray(events)) {
      throw new Error('AI response is not an array')
    }

    // Insert events as pending (approved = false)
    let inserted = 0
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
        source: 'perplexity',
        approved: false,
      })

      if (!error) inserted++
    }

    return new Response(
      JSON.stringify({ success: true, discovered: events.length, inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
