/**
 * Generates a Google Calendar "create event" URL pre-filled with event details.
 */
export function generateGoogleCalendarUrl({ title, date, time, location, description }) {
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const dateClean = date.replace(/-/g, '')

  let dates
  if (time) {
    const parts = time.split(' - ')
    const startTime = parts[0].trim().replace(':', '') + '00'
    const endTime = parts[1]
      ? parts[1].trim().replace(':', '') + '00'
      : padEndTime(parts[0].trim())
    dates = `${dateClean}T${startTime}/${dateClean}T${endTime}`
  } else {
    // All-day event: end date is exclusive, so add one day
    const endDate = nextDay(date)
    dates = `${dateClean}/${endDate}`
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
