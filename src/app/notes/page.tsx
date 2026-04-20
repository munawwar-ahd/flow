"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft } from "lucide-react";
import { NoteList } from "@/components/notes/NoteList";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { UserMenu } from "@/components/shared/UserMenu";
import { useNotes } from "@/stores/notes";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { spring } from "@/lib/motion";

function NotesInner() {
  const search = useSearchParams();
  const router = useRouter();
  const notes = useNotes((s) => s.notes);
  const add = useNotes((s) => s.add);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const idFromUrl = search.get("id");
  const [activeId, setActiveId] = useState<string | null>(idFromUrl);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setActiveId(idFromUrl);
  }, [idFromUrl]);

  useEffect(() => {
    if (!activeId && notes.length && !isMobile) setActiveId(notes[0].id);
  }, [notes, activeId, isMobile]);

  const select = (id: string) => {
    setActiveId(id);
    router.replace("/notes?id=" + id);
  };

  const create = async () => {
    const n = await add({ title: "New note" });
    select(n.id);
  };

  return (
    <div className="flex h-screen">
      <AnimatePresence initial={false} mode="popLayout">
        {(!isMobile || !activeId) && (
          <motion.aside
            key="list"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={spring.gentle}
            className="w-full md:w-[300px] shrink-0 border-r border-separator/60 flex flex-col"
            style={{ background: "var(--bg-sidebar-soft)" }}
          >
            <div className="px-5 pt-5 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes"
                  className="w-full bg-bg-elevated border border-separator/70 rounded-xl pl-10 pr-3 h-10 text-body focus-ring"
                />
              </div>
            </div>
            <NoteList activeId={activeId} onSelect={select} onCreate={create} query={query} />
          </motion.aside>
        )}
        {(!isMobile || activeId) && (
          <motion.section
            key="editor"
            initial={{ opacity: 0, x: isMobile ? 32 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isMobile ? 32 : 8 }}
            transition={spring.gentle}
            className="flex-1 flex flex-col min-w-0"
          >
            {isMobile && activeId && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-separator">
                <button
                  onClick={() => {
                    setActiveId(null);
                    router.replace("/notes");
                  }}
                  className="flex items-center gap-1 text-accent text-body"
                >
                  <ChevronLeft className="w-4 h-4" /> Notes
                </button>
                <UserMenu variant="compact" />
              </div>
            )}
            {activeId ? (
              <NoteEditor id={activeId} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-tertiary">
                Select a note.
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesInner />
    </Suspense>
  );
}
