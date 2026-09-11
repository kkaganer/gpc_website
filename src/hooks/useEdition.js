import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { editionRange } from '../lib/editionGroups'

// Data for one dated edition of the What's On guide.
//
// Deliberately NOT `useLondonEvents`: that hook floors every query at today,
// which is right for a browse tool and wrong here. An edition is a fixed window,
// and last month's edition must still render last month's events when someone
// opens a link they were sent at the time.
//
// Advertisers come from `public_newsletter_advertisers` (migration 030), not the
// base table -- the base table is authenticated-only and carries contact details.
// The week's welcome comes from `public_newsletter_intros` (034) for the same
// reason: `newsletter_drafts` holds the whole unsent edition, the page needs two
// strings out of it.
export function useEdition(date) {
  const [events, setEvents] = useState([])
  const [regulars, setRegulars] = useState([])
  const [presenting, setPresenting] = useState(null)
  const [supporters, setSupporters] = useState([])
  const [intro, setIntro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const range = editionRange(date)
    if (!range) {
      setError('That is not a date we recognise.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      // Same overlap test as the browse hook: an event counts for this edition if
      // its run has not finished before the window opens and it starts before the
      // window closes. A multi-week show appears in every edition it spans.
      const eventsQuery = supabase
        .from('london_events')
        .select('*')
        .eq('approved', true)
        .eq('is_recurring', false)
        .gte('effective_end_date', range.from)
        .lte('date', range.to)
        .order('date', { ascending: true })
        .order('time', { ascending: true, nullsFirst: false })

      // Weekly drop-ins, which the dated query above cannot reach: a recurring row
      // carries a day_of_week and no date, so every date filter excludes it. They
      // used to exist only inside the email, which meant the guide the email points
      // at was missing the twenty things that happen every single week.
      const regularsQuery = supabase
        .from('london_events')
        .select('*')
        .eq('approved', true)
        .eq('is_recurring', true)

      const advertisersQuery = supabase
        .from('public_newsletter_advertisers')
        .select('*')
        .eq('newsletter_date', range.from)

      // maybeSingle, not single: most weeks have a draft and some do not, and a
      // week without one is the ordinary case for an old edition, not an error.
      const introQuery = supabase
        .from('public_newsletter_intros')
        .select('message, signature')
        .eq('week_of', range.from)
        .maybeSingle()

      const [eventsResult, regularsResult, advertisersResult, introResult] = await Promise.all([
        eventsQuery,
        regularsQuery,
        advertisersQuery,
        introQuery,
      ])

      if (cancelled) return

      if (eventsResult.error) {
        setError(eventsResult.error.message)
        setEvents([])
        setRegulars([])
        setIntro(null)
        setLoading(false)
        return
      }

      setEvents(eventsResult.data || [])

      // Regulars failing is not fatal for the same reason advertisers are not: the
      // dated listings are the page, and a week without the drop-ins still reads.
      setRegulars(regularsResult.error ? [] : regularsResult.data || [])

      // Advertisers failing is not fatal: the guide is the point of the page, and
      // the slots have unsold states that render perfectly well with nothing in
      // them. A missing sponsor must never cost a parent the listings.
      const advertisers = advertisersResult.error ? [] : advertisersResult.data || []
      setPresenting(advertisers.find((a) => a.ad_type === 'featured-ad') || null)
      setSupporters(advertisers.filter((a) => a.ad_type === 'logo-sponsor'))

      // Not fatal either, and for the strongest reason of the three: the welcome
      // is the one thing on this page that is decoration. A week whose draft has
      // not been written yet must still show its listings.
      const introRow = introResult.error ? null : introResult.data
      setIntro(introRow?.message ? introRow : null)

      setLoading(false)
    }

    load().catch(() => {
      if (cancelled) return
      setError('Could not load this edition.')
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [date])

  return { events, regulars, presenting, supporters, intro, loading, error }
}
