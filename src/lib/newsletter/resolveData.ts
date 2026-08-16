// Browser-side data resolver: walks a NewsletterConfig and fetches the events
// + advertisers needed to render it. Mirrors the logic in the edge function's
// handler but runs against the public Supabase client, so RLS applies.

import { supabase } from '../supabase'
import type {
  NewsletterConfig,
  ResolvedData,
  EventData,
  AdvertiserData,
  EventSectionBlock,
  FeaturedBlock,
  PresentingBlock,
  SupporterBlock,
  RegularsBlock,
} from '../../../supabase/functions/_shared/newsletter-renderer'
import { SE_LONDON_AREAS, addDays, nearestFriday } from '../../../supabase/functions/_shared/newsletter-renderer'

export async function resolveDataForConfig(config: NewsletterConfig): Promise<ResolvedData> {
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

  async function runEventSectionQuery(block: EventSectionBlock): Promise<EventData[]> {
    const filter = block.filter
    const dateFrom = addDays(todayIso, filter.dateFrom ?? 0)
    const dateTo = addDays(todayIso, filter.dateTo ?? 7)

    // MIRROR: runEventSectionQuery in supabase/functions/generate-newsletter/index.ts
    // runs the identical query server-side. Change both together, or the preview and
    // the newsletter that actually goes out will disagree.
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

  async function loadAdvertiserForBlock(
    block: PresentingBlock | SupporterBlock
  ): Promise<AdvertiserData | null> {
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

  // FIRST SECTION WINS. Until runs existed, "This Week" [0,7] and "Coming up"
  // [8,21] could not both match a row: each event had one date and fell in one
  // window. The overlap rule broke that — a show running 13-31 August is on
  // during BOTH windows and legitimately matches both queries, so it would be
  // printed twice in the same newsletter.
  //
  // Blocks are walked in render order, so claiming an id on first sight puts a
  // run in the earliest section it belongs to and leaves it out of later ones.
  // MIRROR: generate-newsletter/index.ts does the same thing at its own walk.
  // Change both or the preview and the sent email disagree.
  const claimed = new Set<string>()

  for (const block of config.blocks) {
    if (!block.enabled) continue

    if (block.type === 'featured') {
      const fb = block as FeaturedBlock
      if (fb.mode === 'auto') {
        const { data } = await supabase
          .from('gpc_events')
          .select('*')
          .gte('date', todayIso)
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle()
        resolved.autoFeaturedEvent = (data as EventData) || null
      } else if (fb.eventId) {
        const { data } = await supabase
          .from('gpc_events')
          .select('*')
          .eq('id', fb.eventId)
          .maybeSingle()
        if (data) resolved.events[fb.eventId] = data as EventData
      }
    } else if (block.type === 'eventSection') {
      const es = block as EventSectionBlock
      if (es.mode === 'auto') {
        const rows = await runEventSectionQuery(es)
        const fresh = rows.filter((r) => !r.id || !claimed.has(String(r.id)))
        for (const r of fresh) if (r.id) claimed.add(String(r.id))
        resolved.autoEventsByBlockId[block.id] = fresh
      } else if (es.eventIds && es.eventIds.length > 0) {
        const source = es.filter?.source || 'london_events'
        const { data } = await supabase.from(source).select('*').in('id', es.eventIds)
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
