"use client";
import { WeekView } from "./WeekView";

export function DayView({
  day,
  onEmptySlotClick,
}: {
  day: Date;
  onEmptySlotClick?: (iso: string) => void;
}) {
  return <WeekView anchor={day} days={1} onEmptySlotClick={onEmptySlotClick} />;
}
