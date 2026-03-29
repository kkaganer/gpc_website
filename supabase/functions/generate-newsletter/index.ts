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

    // Get upcoming GPC events
    const { data: gpcEvents } = await supabase
      .from('gpc_events')
      .select('*')
      .eq('status', 'upcoming')
      .order('date', { ascending: true })

    // Get approved London events for the next week
    const now = new Date()
    const weekOut = new Date(now)
    weekOut.setDate(weekOut.getDate() + 7)
    const fromDate = now.toISOString().split('T')[0]
    const toDate = weekOut.toISOString().split('T')[0]

    const { data: londonEvents } = await supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true })

    const gpcSection = (gpcEvents || []).map(e =>
      `- ${e.title} on ${e.date} at ${e.location}${e.price ? ` (${e.price})` : ''}: ${e.description}`
    ).join('\n')

    const londonSection = (londonEvents || []).map(e =>
      `- ${e.title} on ${e.date} at ${e.location} (${e.area || 'London'})${e.is_free ? ' [FREE]' : e.price ? ` (${e.price})` : ''}: ${e.description || ''}`
    ).join('\n')

    const weekOfDate = fromDate

    const prompt = `Generate an HTML email newsletter for "Greenwich Parents & Carers" (GPC), a community of 1,800+ parents in SE London.

BRAND VOICE: Warm, friendly, encouraging. Write as if you're a friend telling another parent about cool things happening this week. Use "we" and "our community". Keep it upbeat but not overly enthusiastic.

NEWSLETTER STRUCTURE:
1. Header with GPC logo area and "Weekly Newsletter" title
2. A warm 2-3 sentence intro greeting for the week
3. "GPC Events" section (if any upcoming GPC events exist)
4. "What's On This Week" section - London family events grouped by area
5. Brief closing with a warm sign-off

GPC EVENTS:
${gpcSection || 'No upcoming GPC events this week.'}

LONDON EVENTS THIS WEEK:
${londonSection || 'No curated London events this week.'}

DESIGN REQUIREMENTS:
- Use table-based layout (email-compatible)
- Inline styles only (no <style> tags)
- Max width: 600px, centered
- Background: #fffaf5 (warm off-white)
- Primary color: #fc16a0 (hot pink) for headers, buttons, accents
- Dark color: #2d1b4e (deep purple) for headings
- Font stack: 'Poppins', 'Nunito', Arial, sans-serif
- Section headers: bold, dark purple, with a pink underline
- Event cards: white background, subtle border, rounded corners
- Each event should show: name, date, location, and a brief description
- Include a "View on Website" button linking to the GPC events page
- Footer with: "Greenwich Parents & Carers CIC (16387545)" and unsubscribe placeholder

Return ONLY the complete HTML document, starting with <!DOCTYPE html>. No markdown, no explanation.`

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
            content: 'You are an expert email HTML developer. Generate production-ready HTML email newsletters with inline styles and table-based layouts. Return only HTML, no markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    let htmlContent = result.choices?.[0]?.message?.content || ''

    // Clean up any markdown wrapping
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

    // Save the draft
    const title = `GPC Newsletter - Week of ${weekOfDate}`
    const { data: draft, error: insertError } = await supabase
      .from('newsletter_drafts')
      .insert({
        title,
        content_html: htmlContent,
        content_json: {
          gpc_events: gpcEvents || [],
          london_events: londonEvents || [],
        },
        status: 'draft',
        week_of: weekOfDate,
        events_included: [
          ...(gpcEvents || []).map(e => ({ type: 'gpc', id: e.id, title: e.title })),
          ...(londonEvents || []).map(e => ({ type: 'london', id: e.id, title: e.title })),
        ],
      })
      .select()
      .single()

    if (insertError) throw insertError

    return new Response(
      JSON.stringify({ success: true, draft_id: draft.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
