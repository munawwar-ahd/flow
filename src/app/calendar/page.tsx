"use client";
import { useRef, useState } from "react";
import { addMonths, addWeeks, format } from "date-fns";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { Button } from "@/components/shared/Button";
import { UserMenu } from "@/components/shared/UserMenu";
import { useEvents } from "@/stores/events";
import { parseICS } from "@/lib/ics";

type View = "month" | "week";

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const addMany = useEvents((s) => s.addMany);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    const text = await file.text();
    const events = parseICS(text);
    if (events.length) await addMany(events);
  };

  const move = (dir: 1 | -1) => {
    if (view === "month") setAnchor((d) => addMonths(d, dir));
    else setAnchor((d) => addWeeks(d, dir));
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-30 glass border-b border-separator px-5 md:px-8 pt-safe">
        <div className="flex items-center justify-between h-16 gap-3">
          <h1 className="text-title tracking-tight truncate">
            {view === "month" ? format(anchor, "MMMM yyyy") : `Week of ${format(anchor, "d MMM")}`}
          </h1>

          <div className="flex items-center gap-2">
            <SegmentedControl
              value={view}
              onChange={(v) => setView(v)}
              options={[
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
              ]}
              size="sm"
            />
            <div className="flex items-center gap-1 bg-bg-secondary rounded-btn p-0.5 border border-separator">
              <button
                onClick={() => move(-1)}
                aria-label="Previous"
                className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAnchor(new Date())}
                className="h-8 px-3 rounded-[10px] hover:bg-bg-elevated text-caption font-medium"
              >
                Today
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Next"
                className="w-8 h-8 rounded-[10px] hover:bg-bg-elevated flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import .ics</span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
            />
            <UserMenu variant="compact" className="md:hidden" />
          </div>
        </div>
      </header>

      {view === "month" ? (
        <MonthView
          month={anchor}
          onDayClick={(d) => {
            setAnchor(d);
            setView("week");
          }}
        />
      ) : (
        <WeekView anchor={anchor} />
      )}
    </div>
  );
}
