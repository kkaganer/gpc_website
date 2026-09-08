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
  renderWhatsapp,
} from '../_shared/newsletter-renderer.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------- Default config builder (for legacy {intro_message, week_of} requests) ----------
//
// MIRROR: defaultConfig in src/lib/newsletter/defaults.ts builds the identical
// block sequence. Change both together, or a draft opened in the editor will not
// match the one this function produced.
//
// The default edition is short on purpose: one paid placement, five picks and a
// button through to the week's page on the site. The long-form blocks are all
// still available in the editor; they are simply not what an ordinary week is
// made of any more.

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
      { id: uid(), type: 'intro', enabled: true, message: introMessage, signature: '— Aster' },
      // Above the picks: the paid slot is the first thing after the welcome, and
      // unsold it becomes GPC's own invitation at the same size.
      { id: uid(), type: 'presenting', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: "This week's picks",
        layout: 'picks',
        limit: 5,
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 7, areas: 'se-london' },
      },
      { id: uid(), type: 'editionCta', enabled: true },
      { id: uid(), type: 'featured', enabled: true, mode: 'auto' },
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
//  - autoAdvertiserByBlockId: the chosen advertiser for an auto-mode presenting block
//  - autoAdvertisersByBlockId: every logo booked, for an auto-mode supporter block
//  - editionEventCount: how many things the week's page carries
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
    autoAdvertisersByBlockId: {},
    autoFeaturedEvent: null,
    autoRegulars: [],
    editionEventCount: 0,
  }

  const todayIso = new Date().toISOString().split('T')[0]
  const weekOfIso = config.metadata.weekOf || nearestFriday(todayIso)

  // Helper to run an eventSection auto query
  async function runEventSectionQuery(block: EventSectionBlock): Promise<EventData[]> {
    const filter = block.filter
    const dateFrom = addDays(todayIso, filter.dateFrom ?? 0)
    const dateTo = addDays(todayIso, filter.dateTo ?? 7)

    // MIRROR: runEventSectionQuery in src/lib/newsletter/resolveData.ts runs the
    // identical query browser-side for the preview. Change both together, or the
    // preview and the newsletter that actually goes out will disagree.
    //
    // Overlap rule: an event belongs in [dateFrom, dateTo] when it starts on or before
    // the window ends AND has not finished before the window starts. Filtering the
    // lower bound on when an event FINISHES is what lets a multi-week run (a theatre
    // run, a museum exhibition) appear while it is mid-run instead of only in the week
    // it opened. effective_end_date is a generated column, coalesce(end_date, date),
    // so a one-off with no end_date behaves exactly as before.
    // Only london_events has end_date (migration 002); gpc_events has no end date, so
    // it keeps filtering on `date`.
    const notFinishedBefore = filter.source === 'london_events' ? 'effective_end_date' : 'date'

    let q = supabase
      .from(filter.source)
      .select('*')
      .gte(notFinishedBefore, dateFrom)
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

  // Every booking of one tier for this week, oldest first. Ordering is explicit so
  // the supporter row is stable between the preview and the sent email.
  // MIRROR: loadAdvertisers in src/lib/newsletter/resolveData.ts.
  async function loadAdvertisers(adType: string): Promise<AdvertiserData[]> {
    const { data } = await supabase
      .from('newsletter_advertisers')
      .select('*')
      .eq('newsletter_date', weekOfIso)
      .eq('ad_type', adType)
      .in('status', ['confirmed', 'included'])
      .order('created_at', { ascending: true })
    return (data as AdvertiserData[]) || []
  }

  // How many things are on the edition page this week -- the number the CTA and
  // the WhatsApp message both quote. Not derivable from the blocks: the email
  // carries five picks and the page carries the lot.
  // MIRROR: countEditionEvents in src/lib/newsletter/resolveData.ts, and the pair
  // of queries in src/hooks/useEdition.js that builds the page itself.
  async function countEditionEvents(): Promise<number> {
    const to = addDays(weekOfIso, 6)
    const [dated, regulars] = await Promise.all([
      supabase
        .from('london_events')
        .select('id', { count: 'exact', head: true })
        .eq('approved', true)
        .eq('is_recurring', false)
        .gte('effective_end_date', weekOfIso)
        .lte('date', to),
      supabase
        .from('london_events')
        .select('id', { count: 'exact', head: true })
        .eq('approved', true)
        .eq('is_recurring', true),
    ])
    return (dated.count || 0) + (regulars.count || 0)
  }

  // FIRST SECTION WINS. Until runs existed, "This Week" [0,7] and "Coming up"
  // [8,21] could not both match a row: each event had one date and fell in one
  // window. The overlap rule broke that — a show running 13-31 August is on
  // during BOTH windows and legitimately matches both queries, so it would be
  // printed twice in the same newsletter that goes out to subscribers.
  //
  // Blocks are walked in render order, so claiming an id on first sight puts a
  // run in the earliest section it belongs to and leaves it out of later ones.
  // MIRROR: src/lib/newsletter/resolveData.ts does the same at its own walk.
  // Change both, or the admin preview and the sent email disagree.
  const claimed = new Set<string>()

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
        // FIRST SECTION WINS — see the note at `claimed` above. A run spanning
        // the This Week / Coming up boundary matches both windows under the
        // overlap rule and would otherwise print twice in one email.
        const rows = await runEventSectionQuery(es)
        const fresh = rows.filter((r) => !r.id || !claimed.has(String(r.id)))
        for (const r of fresh) if (r.id) claimed.add(String(r.id))
        resolved.autoEventsByBlockId[block.id] = fresh
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
    } else if (block.type === 'presenting') {
      const pb = block as PresentingBlock
      if (pb.mode === 'auto') {
        // One slot, so one row -- but off an ordered list rather than an unordered
        // limit(1), so a week with two featured-ad bookings picks the same one
        // every time instead of whichever the planner happened to emit.
        const [first] = await loadAdvertisers('featured-ad')
        resolved.autoAdvertiserByBlockId[block.id] = first || null
      } else if (pb.advertiserId) {
        const { data } = await supabase
          .from('newsletter_advertisers')
          .select('*')
          .eq('id', pb.advertiserId)
          .maybeSingle()
        if (data) resolved.advertisers[pb.advertiserId] = data as AdvertiserData
      }
    } else if (block.type === 'supporter') {
      const sb = block as SupporterBlock
      if (sb.mode === 'auto') {
        resolved.autoAdvertisersByBlockId[block.id] = await loadAdvertisers('logo-sponsor')
      } else if (sb.advertiserIds && sb.advertiserIds.length > 0) {
        const { data } = await supabase
          .from('newsletter_advertisers')
          .select('*')
          .in('id', sb.advertiserIds)
        for (const row of (data as AdvertiserData[]) || []) {
          if (row.id) resolved.advertisers[row.id] = row
        }
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

  resolved.editionEventCount = await countEditionEvents()

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
    const whatsappText = renderWhatsapp(config, resolved)

    // Persist as draft
    const title = `GPC Newsletter - Week of ${config.metadata.weekOf}`
    const { data: draft, error: insertError } = await supabase
      .from('newsletter_drafts')
      .insert({
        title,
        content_html: htmlContent,
        whatsapp_text: whatsappText,
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

    // Mark auto-resolved advertisers as 'included' (leave already-included rows alone).
    // The supporter block resolves to a LIST now; collecting only the first would
    // leave three of four paid logos sitting at 'confirmed' after they had gone
    // out, which is the record the click report is reconciled against.
    const usedAdvertiserIds: string[] = []
    for (const block of config.blocks) {
      if (!block.enabled) continue
      if (block.type === 'presenting') {
        const adv = resolved.autoAdvertiserByBlockId[block.id]
        if (adv?.id) usedAdvertiserIds.push(adv.id)
      } else if (block.type === 'supporter') {
        for (const adv of resolved.autoAdvertisersByBlockId[block.id] || []) {
          if (adv?.id) usedAdvertiserIds.push(adv.id)
        }
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
      const all = resolved.autoEventsByBlockId[block.id] || []
      // Capped the same way the renderer caps it. A picks block resolves twelve
      // rows and prints five; recording all twelve would have the draft claim
      // events that never appeared in it.
      const events =
        Number.isInteger(block.limit) && (block.limit as number) > 0
          ? all.slice(0, block.limit as number)
          : all
      for (const ev of events) {
        if (ev.id) out.push({ type: 'london', id: ev.id, title: ev.title || '' })
      }
    } else if (block.type === 'presenting') {
      const adv = resolved.autoAdvertiserByBlockId[block.id]
      if (adv?.id) out.push({ type: 'advertiser', id: adv.id, title: adv.event_title || '' })
    } else if (block.type === 'supporter') {
      for (const adv of resolved.autoAdvertisersByBlockId[block.id] || []) {
        if (adv?.id) out.push({ type: 'advertiser', id: adv.id, title: adv.advertiser_name || '' })
      }
    }
  }
  return out
}
