"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useNotes } from "@/stores/notes";
import { useTasks } from "@/stores/tasks";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";

function renderMarkdown(md: string): string {
  if (!md) return "";
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  const out: string[] = [];
  for (let line of lines) {
    const raw = line;
    line = escape(line);
    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    line = line.replace(/`([^`]+)`/g, "<code>$1</code>");
    line = line.replace(
      /@\[([^\]]+)\]\(task:([^)]+)\)/g,
      '<a class="text-accent underline" data-task="$2">@$1</a>'
    );
    if (/^###\s+/.test(raw)) out.push(`<h3>${line.replace(/^###\s+/, "")}</h3>`);
    else if (/^##\s+/.test(raw)) out.push(`<h2>${line.replace(/^##\s+/, "")}</h2>`);
    else if (/^#\s+/.test(raw)) out.push(`<h1>${line.replace(/^#\s+/, "")}</h1>`);
    else if (/^\[\]\s+/.test(raw))
      out.push(`<div class="note-task"><input type="checkbox" class="flow-check" disabled>${line.replace(/^\[\]\s+/, "")}</div>`);
    else if (/^\[x\]\s+/i.test(raw))
      out.push(`<div class="note-task"><input type="checkbox" class="flow-check" checked disabled><span class="line-through text-text-tertiary">${line.replace(/^\[x\]\s+/i, "")}</span></div>`);
    else if (/^-\s+/.test(raw)) out.push(`<li>${line.replace(/^-\s+/, "")}</li>`);
    else if (/^\d+\.\s+/.test(raw)) out.push(`<li class="ordered">${line.replace(/^\d+\.\s+/, "")}</li>`);
    else if (raw.trim() === "") out.push("<br>");
    else out.push(`<p>${line}</p>`);
  }
  return out.join("");
}

export function NoteEditor({ id }: { id: string }) {
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);
  const linkTask = useNotes((s) => s.linkTask);
  const tasks = useTasks((s) => s.tasks);

  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [mentionQuery, setMentionQuery] = useState<{ at: number; query: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
  }, [id, note]);

  useEffect(() => {
    if (!note) return;
    const h = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        update(id, { title, content });
      }
    }, 2000);
    return () => clearTimeout(h);
  }, [title, content, id, note, update]);

  const commit = () => {
    if (!note) return;
    if (title !== note.title || content !== note.content) update(id, { title, content });
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-tertiary">
        <div className="text-center">
          <div className="text-body">Select a note or create one.</div>
          <div className="text-caption text-text-tertiary/70 mt-1">
            Press ⌘⇧N to start a new one
          </div>
        </div>
      </div>
    );
  }

  const filteredMentions = mentionQuery
    ? tasks
        .filter((t) => t.title.toLowerCase().includes(mentionQuery.query.toLowerCase()))
        .slice(0, 5)
    : [];

  const onContentChange = (value: string) => {
    setContent(value);
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = value.slice(0, cursor);
    const at = before.lastIndexOf("@");
    if (at >= 0) {
      const between = before.slice(at + 1);
      if (/^[^\s@]{0,30}$/.test(between)) {
        setMentionQuery({ at, query: between });
        return;
      }
    }
    setMentionQuery(null);
  };

  const insertMention = (taskId: string, title: string) => {
    if (!mentionQuery) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = content.slice(0, mentionQuery.at);
    const after = content.slice(cursor);
    const insert = `@[${title}](task:${taskId})`;
    const next = before + insert + after;
    setContent(next);
    setMentionQuery(null);
    linkTask(id, taskId);
    setTimeout(() => {
      ta.focus();
      const pos = (before + insert).length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring.gentle}
      className="flex-1 flex flex-col h-full"
    >
      <div className="px-8 md:px-12 pt-8 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input
            value={title}
            placeholder="Untitled"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commit}
            className="w-full bg-transparent text-display focus:outline-none placeholder:text-text-tertiary"
            style={{ letterSpacing: "-0.5px" }}
          />
          <div className="text-caption text-text-tertiary mt-1">
            Updated {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm("Delete this note?")) remove(id);
          }}
          aria-label="Delete note"
          className="w-9 h-9 rounded-full hover:bg-danger/10 hover:text-danger text-text-tertiary flex items-center justify-center focus-ring cursor-pointer transition-colors shrink-0 mt-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={commit}
            placeholder={"Start writing...\n\nTry: # heading, - bullet, [] todo, @task to link"}
            className="h-full resize-none bg-transparent px-8 md:px-12 py-4 text-body leading-relaxed focus:outline-none flow-scroll border-r border-separator/50 placeholder:text-text-tertiary"
          />
          <div
            className={cn(
              "hidden md:block h-full overflow-y-auto flow-scroll px-12 py-4 prose-flow"
            )}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>

        <AnimatePresence>
          {mentionQuery && filteredMentions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={spring.snappy}
              className="absolute bottom-20 left-10 w-72 glass rounded-card shadow-card overflow-hidden border border-separator z-10"
            >
              <div className="text-micro uppercase tracking-wide text-text-tertiary px-3 pt-2">
                Link task
              </div>
              {filteredMentions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => insertMention(t.id, t.title)}
                  className="w-full text-left px-3 py-2 text-body hover:bg-accent hover:text-white transition-colors truncate"
                >
                  {t.title}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
