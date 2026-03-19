import React, { useMemo } from 'react'
import { Booking, BookingStatus, PositionedBooking, RoomUnit } from '@/types'
import { useVisibleRange } from '@/hooks/useVisibleRange'
import { buildDayLabels, getDayOffset } from '@/lib/bookingCalendar'
import { RoomRow } from './RoomRow'
import { VisibleDayColumns } from './VisibleDayColumns'
import { useAppContext } from '@/context/AppContext'

const TOTAL_DAYS = 30
const ROOM_LABEL_WIDTH_PX = 140
const EMPTY_POSITIONED_BOOKINGS: PositionedBooking[] = []

const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: '#4CAF50',
  pending: '#FF9800',
  in_house: '#2196F3',
  checked_out: '#9E9E9E',
  cancelled: '#F44336',
}

interface BookingGridProps {
  roomUnits: RoomUnit[]
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
}

export function BookingGrid({ roomUnits, bookings, onBookingClick }: BookingGridProps) {
  const { config } = useAppContext()
  const columnWidthPx = config.columnWidthPx
  const { scrollContainerRef, visibleRange, handleScroll } = useVisibleRange({
    totalColumns: TOTAL_DAYS,
    columnWidthPx,
    overscanColumns: config.visibleColumnsBuffer,
    fixedPaneWidthPx: ROOM_LABEL_WIDTH_PX,
  })

  const calendarStartDate = config.dateRangeStart
  const dayLabels = useMemo(() => {
    return buildDayLabels(calendarStartDate, TOTAL_DAYS)
  }, [calendarStartDate])
  const bookingsByRoomId = useMemo(() => {
    return bookings.reduce<Record<string, PositionedBooking[]>>((groupedBookings, booking) => {
      const roomBookings = groupedBookings[booking.roomUnit.roomId] ?? []
      roomBookings.push({
        booking,
        startDayIndex: getDayOffset(booking.checkIn, calendarStartDate),
        endDayIndex: getDayOffset(booking.checkOut, calendarStartDate),
        color: STATUS_COLORS[booking.status] ?? '#ccc',
      })
      groupedBookings[booking.roomUnit.roomId] = roomBookings
      return groupedBookings
    }, {})
  }, [bookings, calendarStartDate])
  const trackWidthPx = TOTAL_DAYS * columnWidthPx + ROOM_LABEL_WIDTH_PX

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', background: '#fafafa' }}>
        <div style={{ width: ROOM_LABEL_WIDTH_PX, minWidth: ROOM_LABEL_WIDTH_PX, padding: '8px 12px', fontWeight: 600, fontSize: 13, borderRight: '1px solid #eee', background: config.bookingHeaderBackground }}>
          Room
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            background: config.bookingHeaderBackground
          }}
        >
          <VisibleDayColumns
            visibleRange={visibleRange}
            offsetPx={visibleRange.offsetPx}
            renderDay={(dayIndex, visibleColumnIndex) => (
              <div
                key={dayIndex}
                style={{
                  position: 'absolute',
                  left: visibleColumnIndex * columnWidthPx,
                  width: columnWidthPx,
                  minWidth: columnWidthPx,
                  padding: '8px 4px',
                  fontSize: 11,
                  textAlign: 'center',
                  borderRight: '1px solid #eee',
                  color: '#666',
                }}
              >
                {dayLabels[dayIndex]}
              </div>
            )}
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ minWidth: trackWidthPx }}>
          {roomUnits.map(room => {
            return (
              <RoomRow
                key={room.id}
                rowName={room.name}
                columnWidthPx={columnWidthPx}
                positionedBookings={bookingsByRoomId[room.id] ?? EMPTY_POSITIONED_BOOKINGS}
                roomLabelWidthPx={ROOM_LABEL_WIDTH_PX}
                visibleRange={visibleRange}
                onBookingClick={onBookingClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
