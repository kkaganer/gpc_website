import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  createRenderers,
  addDays,
  nearestFriday,
  formatDateLong,
  SE_LONDON_AREAS,
  NewsletterConfig,
  ResolvedData,
  EventSectionBlock,
  FeaturedBlock,
  PresentingBlock,
  SupporterBlock,
  RegularsBlock,
  Block,
  EventData,
  AdvertiserData,
} from '../_shared/newsletter-renderer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------- Default config builder (for legacy {intro_message, week_of} requests) ----------

function makeDefaultConfig(
  todayIso: string,
  weekOfIso: string,
  introMessage: string
): NewsletterConfig {
  const uid = () =>
    'b_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)

  return {
    version: 2,
    theme: {},
    metadata: {
      todayLong: formatDateLong(todayIso),
      weekOf: weekOfIso,
    },
    blocks: [
      { id: uid(), type: 'masthead', enabled: true },
      { id: uid(), type: 'subscribe', enabled: true, label: 'Subscribe', url: '' },
      { id: uid(), type: 'intro', enabled: true, message: introMessage, signature: '- Aster' },
      { id: uid(), type: 'featured', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'This Week',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 7, areas: 'se-london' },
        gotNewsFooter: true,
      },
      { id: uid(), type: 'presenting', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'Coming up',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 8, dateTo: 21, areas: 'se-london' },
      },
      { id: uid(), type: 'donationStrip', enabled: true },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'Further to travel',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 21, areas: 'outside-se-london' },
      },
      { id: uid(), type: 'regulars', enabled: true, mode: 'auto' },
      { id: uid(), type: 'supporter', enabled: true, mode: 'auto' },
      { id: uid(), type: 'footer', enabled: true },
    ],
  }
}

// ---------- Data resolver ----------
//
// Walks a config and populates the ResolvedData bag:
//  - autoEventsByBlockId: results of auto-mode event-section queries
//  - autoFeaturedEvent: the next upcoming GPC event (for auto-mode featured block)
//  - autoAdvertiserByBlockId: the chosen advertiser per auto-mode presenting/supporter block
//  - autoRegulars: the recurring rows (for auto-mode regulars block)
//  - events / advertisers: resolved rows for any manual-mode block that specifies IDs

async function resolveDataForConfig(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  config: NewsletterConfig
): Promise<ResolvedData> {
  const resolved: ResolvedData = {
    events: {},
    advertisers: {},
    autoEventsByBlockId: {},
    autoAdvertiserByBlockId: {},
    autoFeaturedEvent: null,
    autoRegulars: [],
  }

  const todayIso = new Date().toISOString().split('T')[0]
  const weekOfIso = config.metadata.weekOf || nearestFriday(todayIso)

  // Helper to run an eventSection auto query
  async function runEventSectionQuery(block: EventSectionBlock): Promise<EventData[]> {
    const filter = block.filter
    const dateFrom = addDays(todayIso, filter.dateFrom ?? 0)
    const dateTo = addDays(todayIso, filter.dateTo ?? 7)

    let q = supabase
      .from(filter.source)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    if (filter.source === 'london_events') {
      q = q.eq('approved', true).eq('is_recurring', false)
      if (filter.areas === 'se-london') {
        q = q.in('area', SE_LONDON_AREAS)
      } else if (filter.areas === 'outside-se-london') {
        const csv = `(${SE_LONDON_AREAS.map((a) => `"${a}"`).join(',')})`
        q = q.not('area', 'in', csv)
      }
    }

    const { data } = await q
    return (data as EventData[]) || []
  }

  async function loadAdvertiserForBlock(block: PresentingBlock | SupporterBlock): Promise<AdvertiserData | null> {
    const adType = block.type === 'presenting' ? 'featured-ad' : 'logo-sponsor'
    const { data } = await supabase
      .from('newsletter_advertisers')
      .select('*')
      .eq('newsletter_date', weekOfIso)
      .eq('ad_type', adType)
      .in('status', ['confirmed', 'included'])
      .limit(1)
      .maybeSingle()
    return (data as AdvertiserData) || null
  }

  // Walk blocks and dispatch
  for (const block of config.blocks) {
    if (!block.enabled) continue

    if (block.type === 'featured') {
      const featuredBlock = block as FeaturedBlock
      if (featuredBlock.mode === 'auto') {
        const { data } = await supabase
          .from('gpc_events')
          .select('*')
          .gte('date', todayIso)
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle()
        resolved.autoFeaturedEvent = (data as EventData) || null
      } else if (featuredBlock.eventId) {
        const { data } = await supabase
          .from('gpc_events')
          .select('*')
          .eq('id', featuredBlock.eventId)
          .maybeSingle()
        if (data) resolved.events[featuredBlock.eventId] = data as EventData
      }
    } else if (block.type === 'eventSection') {
      const es = block as EventSectionBlock
      if (es.mode === 'auto') {
        resolved.autoEventsByBlockId[block.id] = await runEventSectionQuery(es)
      } else if (es.eventIds && es.eventIds.length > 0) {
        const source = es.filter?.source || 'london_events'
        const { data } = await supabase
          .from(source)
          .select('*')
          .in('id', es.eventIds)
        for (const row of (data as EventData[]) || []) {
          if (row.id) resolved.events[row.id] = row
        }
      }
    } else if (block.type === 'presenting' || block.type === 'supporter') {
      const ab = block as PresentingBlock | SupporterBlock
      if (ab.mode === 'auto') {
        resolved.autoAdvertiserByBlockId[block.id] = await loadAdvertiserForBlock(ab)
      } else if (ab.advertiserId) {
        const { data } = await supabase
          .from('newsletter_advertisers')
          .select('*')
          .eq('id', ab.advertiserId)
          .maybeSingle()
        if (data) resolved.advertisers[ab.advertiserId] = data as AdvertiserData
      }
    } else if (block.type === 'regulars') {
      const rb = block as RegularsBlock
      if (rb.mode === 'auto') {
        const { data } = await supabase
          .from('london_events')
          .select('*')
          .eq('approved', true)
          .eq('is_recurring', true)
        resolved.autoRegulars = (data as EventData[]) || []
      } else if (rb.eventIds && rb.eventIds.length > 0) {
        const { data } = await supabase
          .from('london_events')
          .select('*')
          .in('id', rb.eventIds)
        for (const row of (data as EventData[]) || []) {
          if (row.id) resolved.events[row.id] = row
        }
      }
    }
  }

  return resolved
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))

    // Two request shapes supported:
    //  1. Legacy: { intro_message, week_of } from the old NewsletterManager form
    //  2. Editor:  { config } from the new visual section editor (NewsletterConfig)
    const todayIso = new Date().toISOString().split('T')[0]
    let config: NewsletterConfig
    if (body?.config?.version === 2) {
      config = body.config as NewsletterConfig
    } else {
      const introMessage: string = body?.intro_message || ''
      const weekOfDate: string = body?.week_of || nearestFriday(todayIso)
      config = makeDefaultConfig(todayIso, weekOfDate, introMessage)
    }

    // Resolve data
    const resolved = await resolveDataForConfig(supabase, config)

    // Render
    const { renderNewsletter } = createRenderers(config.theme)
    const htmlContent = renderNewsletter(config, resolved)

    // Persist as draft
    const title = `GPC Newsletter - Week of ${config.metadata.weekOf}`
    const { data: draft, error: insertError } = await supabase
      .from('newsletter_drafts')
      .insert({
        title,
        content_html: htmlContent,
        content_json: {
          version: 2,
          config,
          resolved_snapshot: resolved,
        },
        status: 'draft',
        week_of: config.metadata.weekOf,
        events_included: buildEventsIncluded(config, resolved),
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Mark auto-resolved advertisers as 'included' (leave already-included rows alone)
    const usedAdvertiserIds: string[] = []
    for (const block of config.blocks) {
      if (!block.enabled) continue
      if (block.type === 'presenting' || block.type === 'supporter') {
        const adv = resolved.autoAdvertiserByBlockId[block.id]
        if (adv?.id) usedAdvertiserIds.push(adv.id)
      }
    }
    if (usedAdvertiserIds.length > 0) {
      await supabase
        .from('newsletter_advertisers')
        .update({ status: 'included' })
        .in('id', usedAdvertiserIds)
        .eq('status', 'confirmed')
    }

    return new Response(
      JSON.stringify({ success: true, draft_id: draft.id, html: htmlContent }),
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

// deno-lint-ignore no-explicit-any
function buildEventsIncluded(config: NewsletterConfig, resolved: ResolvedData): any[] {
  const out: { type: string; id: string; title: string }[] = []
  for (const block of config.blocks) {
    if (!block.enabled) continue
    if (block.type === 'featured') {
      const ev = resolved.autoFeaturedEvent
      if (ev?.id) out.push({ type: 'gpc', id: ev.id, title: ev.title || '' })
    } else if (block.type === 'eventSection') {
      const events = resolved.autoEventsByBlockId[block.id] || []
      for (const ev of events) {
        if (ev.id) out.push({ type: 'london', id: ev.id, title: ev.title || '' })
      }
    } else if (block.type === 'presenting' || block.type === 'supporter') {
      const adv = resolved.autoAdvertiserByBlockId[block.id]
      if (adv?.id) out.push({ type: 'advertiser', id: adv.id, title: adv.event_title || '' })
    }
  }
  return out
}
