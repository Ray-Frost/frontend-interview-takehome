import React, { memo, useMemo } from 'react'
import { Booking, PositionedBooking } from '@/types'
import { VisibleRange } from '@/hooks/useVisibleRange'
import { VisibleDayColumns } from './VisibleDayColumns'

interface RoomRowProps {
  rowName: string
  columnWidthPx: number
  positionedBookings: PositionedBooking[]
  roomLabelWidthPx: number
  visibleRange: VisibleRange
  onBookingClick: (booking: Booking) => void
}

function RoomRowComponent({
  rowName,
  columnWidthPx,
  positionedBookings,
  roomLabelWidthPx,
  visibleRange,
  onBookingClick,
}: RoomRowProps) {
  const visibleBookings = useMemo(() => {
    return positionedBookings.filter((positionedBooking) => {
      return (
        positionedBooking.endDayIndex >= visibleRange.startIndex &&
        positionedBooking.startDayIndex <= visibleRange.endIndex
      )
    })
  }, [positionedBookings, visibleRange.endIndex, visibleRange.startIndex])

  return (
    <div
      className="booking-grid-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
      }}
    >
      <div
        className="booking-grid-room-cell"
        style={{
          position: 'sticky',
          left: 0,
          width: roomLabelWidthPx,
          minWidth: roomLabelWidthPx,
          padding: '8px 12px',
          fontWeight: 500,
          fontSize: 13,
          borderRight: '1px solid #eee',
          background: '#fff',
          zIndex: 3,
        }}
      >
        {rowName}
      </div>

      <div style={{ position: 'relative', height: 40, flex: 1, overflow: 'hidden' }}>
        <VisibleDayColumns
          visibleRange={visibleRange}
          renderDay={(dayIndex) => {
            return (
              <div
                key={dayIndex}
                className="booking-grid-day-cell"
                style={{
                  position: 'absolute',
                  left: dayIndex * columnWidthPx,
                  width: columnWidthPx,
                  height: 40,
                  background: 'transparent',
                  borderRight: '1px solid #f0f0f0',
                  cursor: 'default',
                }}
              />
            )
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
          }}
        >
          {visibleBookings.map(({ booking, startDayIndex, endDayIndex, color }) => {
            const left = Math.max(startDayIndex, visibleRange.startIndex) * columnWidthPx
            const width =
              (Math.min(endDayIndex, visibleRange.endIndex) -
                Math.max(startDayIndex, visibleRange.startIndex) +
                1) *
              columnWidthPx

            return (
              <div
                key={booking.id}
                title={`${booking.guestName} (${booking.status})`}
                onClick={() => onBookingClick(booking)}
                style={{
                  position: 'absolute',
                  left,
                  width: width - 2,
                  height: 28,
                  top: 6,
                  background: color,
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 6,
                  fontSize: 11,
                  color: 'white',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                }}
              >
                {booking.guestName}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const RoomRow = memo(RoomRowComponent)
RoomRow.displayName = 'RoomRow'
