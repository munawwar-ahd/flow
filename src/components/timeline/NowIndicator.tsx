"use client";
import { useEffect, useState } from "react";

export function NowIndicator({
  dayStart,
  hourHeight,
  startHour,
  endHour,
}: {
  dayStart: Date;
  hourHeight: number;
  startHour: number;
  endHour: number;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sameDay =
    now.getFullYear() === dayStart.getFullYear() &&
    now.getMonth() === dayStart.getMonth() &&
    now.getDate() === dayStart.getDate();
  if (!sameDay) return null;

  const h = now.getHours() + now.getMinutes() / 60;
  if (h < startHour || h > endHour) return null;
  const top = (h - startHour) * hourHeight;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top, transform: "translateY(-50%)" }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-danger -ml-1.5 shadow-[0_0_0_3px_rgba(255,59,48,0.15)]" />
      <div className="flex-1 h-[2px] bg-danger/80" />
    </div>
  );
}
