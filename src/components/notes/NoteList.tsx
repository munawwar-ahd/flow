"use client";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { useNotes } from "@/stores/notes";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import { UserMenu } from "@/components/shared/UserMenu";
import { SyncIndicator } from "@/components/shared/SyncIndicator";

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
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-separator">
        <h2 className="text-headline">Notes</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreate}
            aria-label="New note"
            className="w-8 h-8 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <SyncIndicator variant="compact" className="md:hidden" />
          <UserMenu variant="compact" className="md:hidden" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto flow-scroll">
        {filtered.length === 0 && (
          <div className="text-center text-text-tertiary text-caption px-6 py-10">
            No notes yet.
            <br />
            Press ⌘⇧N to add one.
          </div>
        )}
        {filtered.map((n) => {
          const preview = n.content.replace(/^#+\s*/gm, "").replace(/[*_`#>-]/g, "").slice(0, 120);
          const active = n.id === activeId;
          return (
            <motion.button
              key={n.id}
              onClick={() => onSelect(n.id)}
              whileTap={{ scale: 0.99 }}
              transition={spring.snappy}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-separator/60 transition-colors",
                active ? "bg-bg-elevated" : "hover:bg-bg-elevated/50"
              )}
            >
              <div className={cn("text-headline truncate", !n.title && "text-text-tertiary italic")}>
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
