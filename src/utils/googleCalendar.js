/**
 * Generates a Google Calendar "create event" URL pre-filled with event details.
 */
export function generateGoogleCalendarUrl({ title, date, endDate, time, location, description }) {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const dateClean = date.replace(/-/g, '')

  // A RUN (endDate after date) is saved as an all-day span covering the whole
  // thing, even when a daily time is known — a single 10:00-11:00 slot on the
  // opening day is the wrong reminder for a three-week show, and for anything
  // already running that day is in the past.
  const isRun = endDate && endDate > date

  let dates
  if (isRun) {
    // Google's all-day end is EXCLUSIVE, so the span must run to the day after
    // the last day or the final date is chopped off the calendar entry.
    dates = `${dateClean}/${nextDay(endDate)}`
  } else if (time) {
    const parts = time.split(' - ')
    const startTime = parts[0].trim().replace(':', '') + '00'
    const endTime = parts[1]
      ? parts[1].trim().replace(':', '') + '00'
      : padEndTime(parts[0].trim())
    dates = `${dateClean}T${startTime}/${dateClean}T${endTime}`
  } else {
    // All-day event: end date is exclusive, so add one day
    const endDateExclusive = nextDay(date)
    dates = `${dateClean}/${endDateExclusive}`
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
  })

  if (location) params.set('location', location)
  if (description) params.set('details', description)

  return `${baseUrl}?${params.toString()}`
}

function nextDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function padEndTime(startTimeStr) {
  const hours = parseInt(startTimeStr.split(':')[0], 10)
  const mins = startTimeStr.split(':')[1]
  const endHour = String(Math.min(hours + 2, 23)).padStart(2, '0')
  return endHour + mins + '00'
}
