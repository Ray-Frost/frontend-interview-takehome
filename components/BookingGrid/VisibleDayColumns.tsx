import React, { useMemo } from 'react'

interface VisibleDayColumnsProps {
  startIndex: number
  endIndex: number
  offsetPx?: number
  renderDay: (dayIndex: number, visibleColumnIndex: number) => React.ReactNode
}

export function VisibleDayColumns({
  startIndex,
  endIndex,
  offsetPx = 0,
  renderDay,
}: VisibleDayColumnsProps) {
  const visibleDayIndices = useMemo(() => {
    return Array.from(
      { length: endIndex - startIndex + 1 },
      (_, dayOffsetIndex) => startIndex + dayOffsetIndex
    )
  }, [endIndex, startIndex])

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
