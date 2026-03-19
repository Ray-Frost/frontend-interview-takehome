export function buildDayLabels(startDate: string, totalDays: number): string[] {
  return Array.from({ length: totalDays }, (_, dayOffset) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + dayOffset)
    return `${currentDate.getMonth() + 1}/${currentDate.getDate()}`
  })
}

export function getDayOffset(date: string, startDate: string): number {
  return Math.floor(
    (new Date(date).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )
}
