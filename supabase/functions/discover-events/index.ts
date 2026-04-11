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
      throw new Error(
        'PERPLEXITY_API_KEY is not configured. Run: supabase secrets set PERPLEXITY_API_KEY=<your-key>'
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Date window: today → today + 14
    const now = new Date()
    const twoWeeksOut = new Date(now)
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14)
    const fromDate = now.toISOString().split('T')[0]
    const toDate = twoWeeksOut.toISOString().split('T')[0]

    const prompt = `Today is ${fromDate}. Find family-friendly events in London happening ONLY between ${fromDate} and ${toDate}. EVERY event must be on or after ${fromDate} — do NOT include past events.

Focus on SE London (Greenwich, Lewisham, Southwark, Deptford, Blackheath, Woolwich, Eltham, Bromley) but include notable London-wide family events too.

Prefer sources like Eventbrite London family events, Time Out London kids section, Kidrated, visitgreenwich.org.uk, Royal Museums Greenwich (National Maritime Museum, Cutty Sark), Horniman Museum, Mudchute Farm, Greenwich Theatre, The Albany Deptford, and Greenwich/Lewisham/Southwark council event pages.

Include a mix of: museum activities, theatre, outdoor events, craft workshops, baby/toddler groups, sports, food markets, seasonal activities.

Only include events you can verify with a real event-page URL. If you can't find a working URL for an event, skip it.

Return 15–20 events. Each event object must have:
- title: event name
- venue: place name (e.g. "Horniman Museum")
- date: YYYY-MM-DD (must be ${fromDate} to ${toDate})
- time: e.g. "10:00 - 14:00" or null
- location: address or area
- area: one of "Greenwich" | "Lewisham" | "Southwark" | "Central London" | "Tower Hamlets" | "Bromley"
- lat: number (e.g. 51.4769)
- lng: number (e.g. -0.0005)
- description: 1-2 sentences
- url: direct link to the event page
- category: one of "Family" | "Outdoor" | "Arts" | "Sports" | "Music" | "Food"
- age_range: e.g. "All ages", "0-5"
- price: e.g. "Free", "£5"
- is_free: true/false

Return a JSON object with a single "events" key containing the array.`

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        temperature: 0.2,
        search_recency_filter: 'month',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that finds local family-friendly events in London. You always return a JSON object with a single "events" key whose value is an array of event objects. Never include markdown fences or explanatory prose.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            schema: {
              type: 'object',
              properties: {
                events: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['title', 'date', 'location'],
                    properties: {
                      title: { type: 'string' },
                      venue: { type: 'string' },
                      date: { type: 'string' },
                      time: { type: ['string', 'null'] },
                      location: { type: 'string' },
                      area: { type: 'string' },
                      lat: { type: ['number', 'null'] },
                      lng: { type: ['number', 'null'] },
                      description: { type: 'string' },
                      url: { type: 'string' },
                      category: { type: 'string' },
                      age_range: { type: 'string' },
                      price: { type: 'string' },
                      is_free: { type: 'boolean' },
                    },
                  },
                },
              },
              required: ['events'],
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    // Perplexity returns a standard chat-completions envelope
    const content: string = result?.choices?.[0]?.message?.content || ''
    const citations: string[] = Array.isArray(result?.citations) ? result.citations : []

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No text content in Perplexity response',
          debug: {
            rawKeys: Object.keys(result || {}),
            choicesLength: result?.choices?.length,
            firstChoiceKeys: result?.choices?.[0] ? Object.keys(result.choices[0]) : null,
            citations,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse JSON — strip any stray markdown fences as a safety net
    let parsed: any
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (_parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse Perplexity response as JSON',
          debug: {
            contentPreview: content.substring(0, 500),
            citations,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // The schema wraps the array in an `events` key. Unwrap it, but also
    // accept a top-level array in case Perplexity drops the wrapper.
    const events: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.events)
        ? parsed.events
        : []

    if (events.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Perplexity returned zero events',
          debug: {
            parsedType: typeof parsed,
            parsedKeys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : null,
            contentPreview: content.substring(0, 500),
            citations,
          },
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
        source: 'perplexity',
        approved: false,
      })

      if (error) {
        insertErrors.push(`${event.title}: ${error.message}`)
      } else {
        inserted++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        discovered: events.length,
        inserted,
        insertErrors: insertErrors.length > 0 ? insertErrors : undefined,
        citations: citations.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
