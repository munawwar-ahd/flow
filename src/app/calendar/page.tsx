"use client";
import { useRef, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LayoutPanelLeft,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { WeekView } from "@/components/calendar/WeekView";
import { MonthView } from "@/components/calendar/MonthView";
import { DayView } from "@/components/calendar/DayView";
import { MiniMonth } from "@/components/calendar/MiniMonth";
import { NextUpCard } from "@/components/calendar/NextUpCard";
import { CategoryProgress } from "@/components/calendar/CategoryProgress";
import { EventModal } from "@/components/calendar/EventModal";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { UserMenu } from "@/components/shared/UserMenu";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { useEvents } from "@/stores/events";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { parseICS } from "@/lib/ics";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";
import type { Task } from "@/types/models";

type View = "month" | "week" | "day";

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [panelOpen, setPanelOpen] = useState(false);
  const [modal, setModal] = useState<
    | { mode: "create" | "edit"; initial: Partial<Task> & { startAt: string; durationMin: number } }
    | null
  >(null);

  const addMany = useEvents((s) => s.addMany);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const tasks = useTasks((s) => s.tasks);
  const setActiveTaskId = useUI((s) => s.setActiveTaskId);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  const move = (dir: 1 | -1) => {
    if (view === "month") setAnchor((d) => addMonths(d, dir));
    else if (view === "week") setAnchor((d) => addWeeks(d, dir));
    else setAnchor((d) => addDays(d, dir));
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setAnchor(d);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    const parsed = parseICS(text);
    if (parsed.length) {
      const now = new Date().toISOString();
      const stamped = parsed.map((e) => ({
        ...e,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }));
      await addMany(stamped);
    }
  };

  const openCreateAt = (iso: string) => {
    setModal({
      mode: "create",
      initial: { startAt: iso, durationMin: 60 },
    });
  };

  const title =
    view === "month"
      ? format(anchor, "MMMM, yyyy")
      : view === "week"
        ? `Week of ${format(startOfWeek(anchor, { weekStartsOn: useUI.getState().settings.weekStartsOn }), "d MMM")}`
        : format(anchor, "EEEE, d MMMM");

  const weekDays = isDesktop ? 7 : isTablet ? 3 : 1;

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Contextual panel (desktop only, inline) */}
      {isDesktop && (
        <aside
          className="w-[280px] shrink-0 border-r border-separator/60 flex flex-col"
          style={{ background: "var(--bg-sidebar-soft)" }}
        >
          <ContextualPanelContent
            anchor={anchor}
            onAnchorChange={setAnchor}
            onNewEvent={() => {
              const now = new Date();
              const rounded = new Date(now);
              rounded.setMinutes(Math.round(rounded.getMinutes() / 15) * 15, 0, 0);
              openCreateAt(rounded.toISOString());
            }}
          />
        </aside>
      )}

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="sticky top-0 z-30 glass border-b border-separator/70 px-5 md:px-8 pt-safe">
          <div className="flex items-center justify-between h-[72px] gap-3">
            <div className="flex items-baseline gap-3 min-w-0">
              {!isDesktop && (
                <button
                  onClick={() => setPanelOpen(true)}
                  aria-label="Open calendar panel"
                  className="w-9 h-9 rounded-full hover:bg-bg-secondary text-text-secondary flex items-center justify-center"
                >
                  <LayoutPanelLeft className="w-4 h-4" />
                </button>
              )}
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring.gentle}
                className="text-[1.75rem] md:text-[2rem] font-bold tracking-tight text-text-primary truncate"
              >
                {title}
              </motion.h1>
              <motion.button
                whileTap={tap}
                transition={spring.snappy}
                onClick={goToday}
                className="hidden sm:inline-flex items-center bg-bg-secondary hover:bg-bg-elevated px-3.5 py-1.5 rounded-full text-[11px] font-bold text-text-primary focus-ring"
              >
                Today
              </motion.button>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <SegmentedControl
                value={view}
                onChange={(v) => setView(v)}
                options={[
                  { value: "month", label: "Month" },
                  { value: "week", label: "Week" },
                  { value: "day", label: "Day" },
                ]}
                size="sm"
                className="hidden sm:inline-flex"
              />

              <div className="flex items-center gap-1 bg-bg-secondary rounded-full p-0.5">
                <button
                  onClick={() => move(-1)}
                  aria-label="Previous"
                  className="w-8 h-8 rounded-full hover:bg-bg-elevated flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(1)}
                  aria-label="Next"
                  className="w-8 h-8 rounded-full hover:bg-bg-elevated flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden md:flex items-center gap-1">
                <motion.button
                  whileTap={tap}
                  transition={spring.snappy}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="w-9 h-9 rounded-full text-text-secondary hover:bg-bg-secondary flex items-center justify-center focus-ring"
                >
                  <Search className="w-[18px] h-[18px]" />
                </motion.button>
                <motion.button
                  whileTap={tap}
                  transition={spring.snappy}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Import .ics"
                  className="w-9 h-9 rounded-full text-text-secondary hover:bg-bg-secondary flex items-center justify-center focus-ring"
                >
                  <Upload className="w-[18px] h-[18px]" />
                </motion.button>
                <motion.button
                  whileTap={tap}
                  transition={spring.snappy}
                  aria-label="Notifications"
                  className="w-9 h-9 rounded-full text-text-secondary hover:bg-bg-secondary flex items-center justify-center focus-ring"
                >
                  <Bell className="w-[18px] h-[18px]" />
                </motion.button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
              />

              <SyncIndicator variant="compact" className="md:hidden" />
              <UserMenu variant="compact" className="md:hidden" />
            </div>
          </div>
        </header>

        {/* Floating "+ New Event" — visible on all breakpoints */}
        <motion.button
          whileTap={tap}
          transition={spring.snappy}
          onClick={() => {
            const now = new Date();
            now.setMinutes(Math.round(now.getMinutes() / 15) * 15, 0, 0);
            openCreateAt(now.toISOString());
          }}
          aria-label="New event"
          className="absolute right-6 bottom-6 md:right-8 md:bottom-8 z-20 h-12 px-5 rounded-full bg-[color:var(--today-pill-bg)] text-[color:var(--today-pill-ink)] font-bold text-sm flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)] focus-ring"
        >
          <Plus className="w-4 h-4" />
          New Event
        </motion.button>

        <div className="flex-1 overflow-y-auto flow-scroll px-4 md:px-8 pt-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring.gentle}
            >
              {view === "month" && (
                <div className="min-h-[70vh]">
                  <MonthView
                    month={anchor}
                    onDayClick={(d) => {
                      setAnchor(d);
                      setView(isMobile ? "day" : "week");
                    }}
                  />
                </div>
              )}
              {view === "week" &&
                (isMobile ? (
                  <MobileDaySwipe anchor={anchor} setAnchor={setAnchor} openCreateAt={openCreateAt} />
                ) : (
                  <WeekView anchor={anchor} days={weekDays} onEmptySlotClick={openCreateAt} />
                ))}
              {view === "day" && (
                isMobile ? (
                  <MobileDaySwipe anchor={anchor} setAnchor={setAnchor} openCreateAt={openCreateAt} />
                ) : (
                  <DayView day={anchor} onEmptySlotClick={openCreateAt} />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile / tablet contextual panel as bottom sheet */}
      <AnimatePresence>
        {panelOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 flex items-end md:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/35" onClick={() => setPanelOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring.gentle}
              className="relative w-full md:max-w-md md:rounded-modal rounded-t-modal p-6 max-h-[85vh] overflow-y-auto flow-scroll pb-safe"
              style={{ background: "var(--bg-sidebar-soft)" }}
            >
              <div className="flex justify-center mb-3 md:hidden">
                <div className="w-10 h-1 rounded-full bg-separator" />
              </div>
              <div className="flex items-center justify-between mb-4 md:hidden">
                <span className="text-headline">Overview</span>
                <button
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ContextualPanelContent
                anchor={anchor}
                onAnchorChange={(d) => {
                  setAnchor(d);
                  setPanelOpen(false);
                }}
                onNewEvent={() => {
                  const now = new Date();
                  now.setMinutes(Math.round(now.getMinutes() / 15) * 15, 0, 0);
                  setPanelOpen(false);
                  openCreateAt(now.toISOString());
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EventModal
        open={modal !== null}
        mode={modal?.mode ?? "create"}
        initial={modal?.initial}
        onClose={() => setModal(null)}
      />
    </div>
  );
}

function ContextualPanelContent({
  anchor,
  onAnchorChange,
  onNewEvent,
}: {
  anchor: Date;
  onAnchorChange: (d: Date) => void;
  onNewEvent: () => void;
}) {
  const [miniMonth, setMiniMonth] = useState(anchor);

  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-y-auto flow-scroll">
      <motion.button
        whileTap={tap}
        transition={spring.snappy}
        onClick={onNewEvent}
        className="w-full h-11 rounded-full font-semibold flex items-center justify-center gap-2 text-[13px] focus-ring"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Plus className="w-4 h-4" />
        New Event
      </motion.button>

      <MiniMonth
        month={miniMonth}
        onMonthChange={setMiniMonth}
        selected={anchor}
        onSelect={onAnchorChange}
      />

      <NextUpCard />

      <div className="mt-auto">
        <CategoryProgress anchor={anchor} />
      </div>
    </div>
  );
}

function MobileDaySwipe({
  anchor,
  setAnchor,
  openCreateAt,
}: {
  anchor: Date;
  setAnchor: (d: Date) => void;
  openCreateAt: (iso: string) => void;
}) {
  return (
    <motion.div
      key={anchor.toISOString()}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        const delta = info.offset.x;
        if (delta > 80) setAnchor(addDays(anchor, -1));
        else if (delta < -80) setAnchor(addDays(anchor, 1));
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={spring.gentle}
    >
      <DayView day={anchor} onEmptySlotClick={openCreateAt} />
    </motion.div>
  );
}
