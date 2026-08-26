export function getCurrentWeekBoundaries(date = new Date()) {
  const d = new Date(date)
  
  // Get day of week (0 is Sunday, 1 is Monday...)
  const day = d.getUTCDay()
  
  // Calculate distance to Monday
  // If today is Sunday (0), we need to go back 6 days to get to Monday.
  // Otherwise, we go back (day - 1) days.
  const diffToMonday = day === 0 ? 6 : day - 1
  
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - diffToMonday)
  monday.setUTCHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  sunday.setUTCHours(23, 59, 59, 999)

  return {
    week_start_date: monday.toISOString().split('T')[0], // YYYY-MM-DD
    week_end_date: sunday.toISOString().split('T')[0]
  }
}

export function formatWeekLabel(dateString: string) {
  const start = new Date(dateString)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return `Week of ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}
