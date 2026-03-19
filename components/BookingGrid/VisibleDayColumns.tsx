import React, { useMemo } from 'react'
import { VisibleRange } from '@/hooks/useVisibleRange'

interface VisibleDayColumnsProps {
  visibleRange: VisibleRange
  offsetPx?: number
  renderDay: (dayIndex: number, visibleColumnIndex: number) => React.ReactNode
}

export function VisibleDayColumns({
  visibleRange,
  offsetPx = 0,
  renderDay,
}: VisibleDayColumnsProps) {
  const visibleDayIndices = useMemo(() => {
    return Array.from(
      { length: visibleRange.endIndex - visibleRange.startIndex + 1 },
      (_, dayOffsetIndex) => visibleRange.startIndex + dayOffsetIndex
    )
  }, [visibleRange.endIndex, visibleRange.startIndex])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: offsetPx === 0 ? undefined : `translateX(-${offsetPx}px)`,
      }}
    >
      {visibleDayIndices.map((dayIndex, visibleColumnIndex) => {
        return renderDay(dayIndex, visibleColumnIndex)
      })}
    </div>
  )
}
