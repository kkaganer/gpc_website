// Occurrence generation: schedule x validity window x term calendar -> dated instances.
//
// This is the half of the model that a dated-event schema cannot express. Sources
// publish "Tuesdays 10:30, term time" and never emit a dated occurrence; we
// generate them, which also means we can suppress a whole school holiday
// correctly instead of publishing 6 weeks of sessions that aren't running.

import type { ScheduleSlot } from './types.ts'

const DAY_INDEX: Record<ScheduleSlot['by_day'], number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

export interface HolidayRange {
  starts_on: string
  ends_on: string
}

export interface GenerateOptions {
  schedule: ScheduleSlot[]
  /** Inclusive ISO dates bounding generation. */
  from: string
  to: string
  starts_on?: string | null
  ends_on?: string | null
  termTimeOnly?: boolean | null
  holidays?: HolidayRange[]
}

export interface GeneratedOccurrence {
  starts_at: string
  ends_at: string | null
}

/**
 * UTC offset for Europe/London on a given calendar date, as "+01:00" / "+00:00".
 *
 * Derived from the ICU timezone database rather than a month heuristic, so BST
 * transitions land on the right day. Deno ships full ICU, so `longOffset` is
 * available.
 */
function londonOffset(isoDate: string): string {
  const probe = new Date(`${isoDate}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    timeZoneName: 'longOffset',
  }).formatToParts(probe)
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  // "GMT+01:00" -> "+01:00"; bare "GMT" -> "+00:00"
  const match = raw.match(/GMT([+-]\d{2}:\d{2})/)
  return match ? match[1] : '+00:00'
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function inRange(date: string, from: string | null | undefined, to: string | null | undefined): boolean {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function isHoliday(date: string, holidays: HolidayRange[]): boolean {
  return holidays.some((h) => date >= h.starts_on && date <= h.ends_on)
}

/** Add minutes to an "HH:MM" wall-clock string, clamping at end of day. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function generateOccurrences(opts: GenerateOptions): GeneratedOccurrence[] {
  const { schedule, from, to, starts_on, ends_on, termTimeOnly, holidays = [] } = opts
  if (!schedule.length) return []

  const out: GeneratedOccurrence[] = []
  const wanted = new Map<number, ScheduleSlot[]>()
  for (const slot of schedule) {
    const idx = DAY_INDEX[slot.by_day]
    if (idx === undefined) continue
    if (!wanted.has(idx)) wanted.set(idx, [])
    wanted.get(idx)!.push(slot)
  }
  if (!wanted.size) return []

  for (let date = from; date <= to; date = addDays(date, 1)) {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay()
    const slots = wanted.get(dow)
    if (!slots) continue

    if (!inRange(date, starts_on, ends_on)) continue

    // Gate G7: a term-time-only activity emits nothing during a school holiday.
    // termTimeOnly === null means UNKNOWN — we still generate, and the publication
    // gate downstream holds the activity as "unconfirmed" rather than showing it.
    if (termTimeOnly === true && isHoliday(date, holidays)) continue

    const offset = londonOffset(date)
    for (const slot of slots) {
      if (!/^\d{2}:\d{2}$/.test(slot.start_time)) continue
      const end = slot.end_time && /^\d{2}:\d{2}$/.test(slot.end_time)
        ? slot.end_time
        : addMinutes(slot.start_time, 60)
      out.push({
        starts_at: `${date}T${slot.start_time}:00${offset}`,
        ends_at: `${date}T${end}:00${offset}`,
      })
    }
  }

  return out
}

/** ISO 8601 duration ("PT45M", "PT1H30M") -> minutes. Returns null if unparseable. */
export function parseIsoDuration(input: string | null | undefined): number | null {
  if (!input) return null
  const m = input.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/)
  if (!m) return null
  const [, d, h, min] = m
  const total = (+(d ?? 0) * 1440) + (+(h ?? 0) * 60) + +(min ?? 0)
  return total > 0 ? total : null
}
