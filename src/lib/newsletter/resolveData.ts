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
} from './renderer'
import { SE_LONDON_AREAS, addDays, nearestFriday } from './renderer'

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
        resolved.autoEventsByBlockId[block.id] = await runEventSectionQuery(es)
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
