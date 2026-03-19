import React, { memo, useMemo } from "react";
import { Booking, PositionedBooking } from "@/types";

const COLUMN_WIDTH_PX = 48;

interface RoomRowProps {
  rowName: string;
  positionedBookings: PositionedBooking[];
  visibleStartIndex: number;
  visibleEndIndex: number;
  onBookingClick: (booking: Booking) => void;
}

function RoomRowComponent({
  rowName,
  positionedBookings,
  visibleStartIndex,
  visibleEndIndex,
  onBookingClick,
}: RoomRowProps) {
  const visibleBookings = useMemo(() => {
    return positionedBookings.filter((positionedBooking) => {
      return (
        positionedBooking.endDayIndex >= visibleStartIndex &&
        positionedBooking.startDayIndex <= visibleEndIndex
      );
    });
  }, [positionedBookings, visibleStartIndex, visibleEndIndex]);

  return (
    <div
      className="booking-grid-row"
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #eee",
      }}
    >
      <div
        className="booking-grid-room-cell"
        style={{
          width: 140,
          minWidth: 140,
          padding: "8px 12px",
          fontWeight: 500,
          fontSize: 13,
          borderRight: "1px solid #eee",
          zIndex: 1,
        }}
      >
        {rowName}
      </div>

      <div style={{ position: "relative", height: 40, flex: 1 }}>
        {/* Day cell backgrounds */}
        {Array.from(
          { length: visibleEndIndex - visibleStartIndex + 1 },
          (_, index) => {
            const dayIndex = visibleStartIndex + index;
            return (
              <div
                key={dayIndex}
                className="booking-grid-day-cell"
                style={{
                  position: "absolute",
                  left: (dayIndex - visibleStartIndex) * COLUMN_WIDTH_PX,
                  width: COLUMN_WIDTH_PX,
                  height: 40,
                  background: "transparent",
                  borderRight: "1px solid #f0f0f0",
                  cursor: "default",
                }}
              />
            );
          },
        )}

        {/* Booking bars */}
        {visibleBookings.map(({ booking, startDayIndex, endDayIndex, color }) => {
          const left = Math.max(
            0,
            (startDayIndex - visibleStartIndex) * COLUMN_WIDTH_PX,
          );
          const width =
            (Math.min(endDayIndex, visibleEndIndex) -
              Math.max(startDayIndex, visibleStartIndex) +
              1) *
            COLUMN_WIDTH_PX;
          return (
            <div
              key={booking.id}
              title={`${booking.guestName} (${booking.status})`}
              onClick={() => onBookingClick(booking)}
              style={{
                position: "absolute",
                left,
                width: width - 2,
                height: 28,
                top: 6,
                background: color,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                paddingLeft: 6,
                fontSize: 11,
                color: "white",
                overflow: "hidden",
                whiteSpace: "nowrap",
                zIndex: 2,
              }}
            >
              {booking.guestName}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const RoomRow = memo(RoomRowComponent);
RoomRow.displayName = "RoomRow";
