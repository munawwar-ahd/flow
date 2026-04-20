"use client";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { useNotes } from "@/stores/notes";
import { cn } from "@/lib/cn";
import { spring, tap } from "@/lib/motion";
import { UserMenu } from "@/components/shared/UserMenu";
import { SyncIndicator } from "@/components/shared/SyncIndicator";
import { HomeLink } from "@/components/shared/HomeLink";

export function NoteList({
  activeId,
  onSelect,
  onCreate,
  query = "",
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  query?: string;
}) {
  const notes = useNotes((s) => s.notes);
  const filtered = query
    ? notes.filter((n) =>
        (n.title + " " + n.content).toLowerCase().includes(query.toLowerCase())
      )
    : notes;

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 flex items-center justify-between gap-2">
        <h2 className="text-title" style={{ letterSpacing: "-0.3px" }}>
          Notes
        </h2>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={tap}
            transition={spring.snappy}
            onClick={onCreate}
            aria-label="New note"
            className="w-9 h-9 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-text-primary flex items-center justify-center focus-ring cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.25} />
          </motion.button>
          <SyncIndicator variant="compact" className="md:hidden" />
          <UserMenu variant="compact" className="md:hidden" />
          <HomeLink />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto flow-scroll px-3 pb-6 space-y-2">
        {filtered.length === 0 && (
          <div className="mx-2 mt-8 rounded-2xl bg-bg-elevated/60 border border-separator/60 px-5 py-8 text-center">
            <div className="text-body text-text-secondary">Start a new note</div>
            <div className="text-caption text-text-tertiary mt-1">
              Press ⌘⇧N or tap +
            </div>
          </div>
        )}
        {filtered.map((n, i) => {
          const preview = n.content
            .replace(/^#+\s*/gm, "")
            .replace(/[*_`#>-]/g, "")
            .slice(0, 120);
          const active = n.id === activeId;
          return (
            <motion.button
              key={n.id}
              onClick={() => onSelect(n.id)}
              whileTap={tap}
              whileHover={{ scale: active ? 1.01 : 1 }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.gentle, delay: Math.min(i, 12) * 0.02 }}
              className={cn(
                "w-full text-left rounded-2xl px-4 py-3 transition-colors focus-ring cursor-pointer",
                active
                  ? "text-text-primary shadow-card"
                  : "text-text-primary hover:bg-bg-elevated"
              )}
              style={
                active ? { background: "var(--event-5)" } : undefined
              }
              aria-current={active ? "true" : undefined}
            >
              <div
                className={cn(
                  "text-headline truncate",
                  !n.title && "text-text-tertiary italic"
                )}
              >
                {n.title || "Untitled"}
              </div>
              <div className="text-caption text-text-secondary line-clamp-2 mt-0.5">
                {preview || "No content"}
              </div>
              <div className="text-micro text-text-tertiary mt-1.5">
                {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
