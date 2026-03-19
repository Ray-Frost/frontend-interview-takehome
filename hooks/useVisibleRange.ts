import { useState, useCallback } from 'react'

const COLUMN_WIDTH_PX = 48
const VISIBLE_COLUMNS = 14

interface VisibleRange {
  startIndex: number
  endIndex: number
}

export function useVisibleRange() {
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startIndex: 0,
    endIndex: VISIBLE_COLUMNS,
  })

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const nextStartIndex = Math.floor(
      event.currentTarget.scrollLeft / COLUMN_WIDTH_PX
    )

    setVisibleRange((previousVisibleRange) => {
      if (previousVisibleRange.startIndex === nextStartIndex) {
        return previousVisibleRange
      }

      return {
        startIndex: nextStartIndex,
        endIndex: nextStartIndex + VISIBLE_COLUMNS,
      }
    })
  }, [])

  return { visibleRange, handleScroll }
}
