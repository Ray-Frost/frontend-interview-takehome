import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface VisibleRange {
  startIndex: number
  endIndex: number
  offsetPx: number
  viewportWidthPx: number
}

interface UseVisibleRangeOptions {
  totalColumns: number
  columnWidthPx: number
  overscanColumns: number
  fixedPaneWidthPx?: number
}

interface ScrollMetrics {
  scrollLeft: number
  viewportWidthPx: number
}

export function useVisibleRange({
  totalColumns,
  columnWidthPx,
  overscanColumns,
  fixedPaneWidthPx = 0,
}: UseVisibleRangeOptions) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    scrollLeft: 0,
    viewportWidthPx: 0,
  })

  const updateScrollMetrics = useCallback((nextScrollMetrics: ScrollMetrics) => {
    setScrollMetrics((currentScrollMetrics) => {
      if (
        currentScrollMetrics.scrollLeft === nextScrollMetrics.scrollLeft &&
        currentScrollMetrics.viewportWidthPx === nextScrollMetrics.viewportWidthPx
      ) {
        return currentScrollMetrics
      }

      return nextScrollMetrics
    })
  }, [])

  const getDayGridViewportWidthPx = useCallback((containerWidthPx: number) => {
    return Math.max(0, containerWidthPx - fixedPaneWidthPx)
  }, [fixedPaneWidthPx])

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const nextScrollLeft = event.currentTarget.scrollLeft
    const nextViewportWidthPx = getDayGridViewportWidthPx(event.currentTarget.clientWidth)

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      updateScrollMetrics({
        scrollLeft: nextScrollLeft,
        viewportWidthPx: nextViewportWidthPx,
      })
      animationFrameRef.current = null
    })
  }, [getDayGridViewportWidthPx, updateScrollMetrics])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) {
      return
    }

    updateScrollMetrics({
      scrollLeft: scrollContainer.scrollLeft,
      viewportWidthPx: getDayGridViewportWidthPx(scrollContainer.clientWidth),
    })

    const resizeObserver = new ResizeObserver((entries) => {
      const nextViewportWidthPx = getDayGridViewportWidthPx(
        Math.round(entries[0]?.contentRect.width ?? scrollContainer.clientWidth)
      )

      updateScrollMetrics({
        scrollLeft: scrollContainer.scrollLeft,
        viewportWidthPx: nextViewportWidthPx,
      })
    })

    resizeObserver.observe(scrollContainer)

    return () => {
      resizeObserver.disconnect()

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [getDayGridViewportWidthPx, updateScrollMetrics])

  const visibleRange = useMemo<VisibleRange>(() => {
    const safeTotalColumns = Math.max(totalColumns, 1)
    const safeOverscanColumns = Math.max(0, overscanColumns)
    const currentViewportWidthPx = Math.max(scrollMetrics.viewportWidthPx, columnWidthPx)
    const firstVisibleIndex = Math.floor(scrollMetrics.scrollLeft / columnWidthPx)
    const visibleColumnCount = Math.max(1, Math.ceil(currentViewportWidthPx / columnWidthPx))
    const startIndex = Math.max(0, firstVisibleIndex - safeOverscanColumns)
    const endIndex = Math.min(
      safeTotalColumns - 1,
      firstVisibleIndex + visibleColumnCount + safeOverscanColumns - 1
    )

    return {
      startIndex,
      endIndex,
      offsetPx: scrollMetrics.scrollLeft - startIndex * columnWidthPx,
      viewportWidthPx: currentViewportWidthPx,
    }
  }, [
    columnWidthPx,
    overscanColumns,
    scrollMetrics.scrollLeft,
    scrollMetrics.viewportWidthPx,
    totalColumns,
  ])

  return { scrollContainerRef, visibleRange, handleScroll }
}
