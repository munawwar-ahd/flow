"use client";
import { format } from "date-fns";

export function HourGutter({
  startHour,
  endHour,
  hourHeight,
}: {
  startHour: number;
  endHour: number;
  hourHeight: number;
}) {
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);
  return (
    <div className="relative w-14 md:w-16 shrink-0 select-none">
      {hours.map((h, i) => {
        const d = new Date();
        d.setHours(h, 0, 0, 0);
        return (
          <div
            key={h}
            className="absolute left-0 right-0 text-micro uppercase tracking-wide text-text-tertiary pr-2 text-right"
            style={{ top: i * hourHeight - 6 }}
          >
            {format(d, "h a")}
          </div>
        );
      })}
    </div>
  );
}
