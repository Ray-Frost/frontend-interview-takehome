import React, { useMemo } from 'react'
import { Booking, BookingStatus, PositionedBooking, RoomUnit } from '@/types'
import { useVisibleRange } from '@/hooks/useVisibleRange'
import { buildDayLabels, getDayOffset } from '@/lib/bookingCalendar'
import { RoomRow } from './RoomRow'
import {useAppContext} from "@/context/AppContext";

const COLUMN_WIDTH_PX = 48
const TOTAL_DAYS = 30
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
  const { visibleRange, handleScroll } = useVisibleRange()
  const { config } = useAppContext()

  const calendarStartDate = config.dateRangeStart
  const dayLabels = buildDayLabels(calendarStartDate, TOTAL_DAYS)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', background: '#fafafa' }}>
        <div style={{ width: 140, minWidth: 140, padding: '8px 12px', fontWeight: 600, fontSize: 13, borderRight: '1px solid #eee', background: config.bookingHeaderBackground }}>
          Room
        </div>
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            background: config.bookingHeaderBackground
          }}
        >
          {Array.from({ length: visibleRange.endIndex - visibleRange.startIndex + 1 }, (_, i) => {
            const dayIndex = visibleRange.startIndex + i
            if (dayIndex >= TOTAL_DAYS) return null
            return (
              <div
                key={dayIndex}
                style={{
                  width: COLUMN_WIDTH_PX,
                  minWidth: COLUMN_WIDTH_PX,
                  padding: '8px 4px',
                  fontSize: 11,
                  textAlign: 'center',
                  borderRight: '1px solid #eee',
                  color: '#666',
                }}
              >
                {dayLabels[dayIndex]}
              </div>
            )
          })}
        </div>
      </div>

      {/* Scrollable grid body */}
      <div
        style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ minWidth: TOTAL_DAYS * COLUMN_WIDTH_PX + 140 }}>
          {roomUnits.map(room => {
            return (
              <RoomRow
                key={room.id}
                rowName={room.name}
                positionedBookings={bookingsByRoomId[room.id] ?? EMPTY_POSITIONED_BOOKINGS}
                visibleStartIndex={visibleRange.startIndex}
                visibleEndIndex={visibleRange.endIndex}
                onBookingClick={onBookingClick}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
