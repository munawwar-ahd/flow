"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { uid } from "@/lib/db";
import { cn } from "@/lib/cn";
import type { Task } from "@/types/models";
import { scheduleReminder, requestNotificationPermission } from "@/lib/notifications";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string) {
  return new Date(v).toISOString();
}

const DURATIONS = [15, 30, 45, 60, 90, 120];
const REMINDERS = [
  { label: "None", value: undefined as number | undefined },
  { label: "At time", value: 0 },
  { label: "5 min before", value: 5 },
  { label: "15 min before", value: 15 },
  { label: "1 hour before", value: 60 },
];

export function TaskEditor() {
  const editor = useUI((s) => s.taskEditorTask);
  const setEditor = useUI((s) => s.setTaskEditor);
  const categories = useUI((s) => s.categories);
  const add = useTasks((s) => s.add);
  const update = useTasks((s) => s.update);

  const [form, setForm] = useState<Partial<Task>>({});

  useEffect(() => {
    if (editor?.mode === "edit" && editor.initial) {
      setForm(editor.initial);
    } else if (editor?.mode === "create") {
      setForm({
        title: "",
        startAt: editor.initial?.startAt ?? new Date().toISOString(),
        durationMin: editor.initial?.durationMin ?? 30,
        categoryId: categories[0]?.id,
        subtasks: [],
        ...editor.initial,
      });
    }
  }, [editor, categories]);

  if (!editor) return null;

  const save = async () => {
    if (!form.title?.trim()) return;
    if (editor.mode === "create") {
      const t = await add({
        title: form.title.trim(),
        startAt: form.startAt || new Date().toISOString(),
        durationMin: form.durationMin || 30,
        notes: form.notes,
        categoryId: form.categoryId,
        subtasks: form.subtasks ?? [],
        reminderMin: form.reminderMin,
      });
      if (t.reminderMin != null) {
        await requestNotificationPermission();
        scheduleReminder({
          id: t.id,
          at: new Date(t.startAt).getTime() - t.reminderMin * 60_000,
          title: t.title,
          body: "Starting " + (t.reminderMin === 0 ? "now" : `in ${t.reminderMin} min`),
        });
      }
    } else if (editor.mode === "edit" && form.id) {
      await update(form.id, form);
    }
    setEditor(null);
  };

  const addSub = () => {
    setForm((f) => ({
      ...f,
      subtasks: [...(f.subtasks ?? []), { id: uid(), title: "", done: false }],
    }));
  };

  return (
    <Modal
      open={!!editor}
      onClose={() => setEditor(null)}
      title={editor.mode === "create" ? "New task" : "Edit task"}
      widthClass="w-[min(92vw,540px)]"
    >
      <div className="space-y-4">
        <input
          autoFocus
          value={form.title ?? ""}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
          }}
          placeholder="What do you want to do?"
          className="w-full bg-transparent text-title focus:outline-none placeholder:text-text-tertiary"
        />

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-caption text-text-secondary">Start</label>
          <input
            type="datetime-local"
            value={form.startAt ? toLocalInput(form.startAt) : ""}
            onChange={(e) => setForm({ ...form, startAt: fromLocalInput(e.target.value) })}
            className="bg-bg-secondary border border-separator rounded-btn px-3 h-9 text-body focus-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-caption text-text-secondary w-16">Duration</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, durationMin: d })}
                className={cn(
                  "h-8 px-3 rounded-chip text-caption border transition-colors",
                  form.durationMin === d
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-secondary text-text-secondary border-separator hover:text-text-primary"
                )}
              >
                {d < 60 ? `${d}m` : `${d / 60}h${d % 60 ? ` ${d % 60}m` : ""}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-caption text-text-secondary w-16">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm({ ...form, categoryId: c.id })}
                className={cn(
                  "h-8 px-3 rounded-chip text-caption border transition-all flex items-center gap-1.5",
                  form.categoryId === c.id ? "ring-2 ring-offset-0" : ""
                )}
                style={{
                  color: c.color,
                  background: c.color + "15",
                  borderColor: c.color + (form.categoryId === c.id ? "88" : "44"),
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-caption text-text-secondary w-16">Remind</label>
          <div className="flex flex-wrap gap-1.5">
            {REMINDERS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setForm({ ...form, reminderMin: r.value })}
                className={cn(
                  "h-8 px-3 rounded-chip text-caption border transition-colors",
                  form.reminderMin === r.value
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-secondary text-text-secondary border-separator hover:text-text-primary"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full bg-bg-secondary border border-separator rounded-btn px-3 py-2 text-body focus-ring resize-none"
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-micro uppercase tracking-wide text-text-tertiary">Subtasks</div>
            <button
              onClick={addSub}
              className="text-caption text-accent hover:brightness-110 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {(form.subtasks ?? []).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="flow-check"
                  checked={s.done}
                  onChange={() => {
                    const next = [...(form.subtasks ?? [])];
                    next[i] = { ...next[i], done: !next[i].done };
                    setForm({ ...form, subtasks: next });
                  }}
                />
                <input
                  value={s.title}
                  onChange={(e) => {
                    const next = [...(form.subtasks ?? [])];
                    next[i] = { ...next[i], title: e.target.value };
                    setForm({ ...form, subtasks: next });
                  }}
                  placeholder="Subtask"
                  className="flex-1 bg-transparent border-b border-separator focus:border-accent focus:outline-none py-1 text-body"
                />
                <button
                  onClick={() => {
                    const next = (form.subtasks ?? []).filter((_, ix) => ix !== i);
                    setForm({ ...form, subtasks: next });
                  }}
                  aria-label="Remove"
                  className="w-6 h-6 rounded-full text-text-tertiary hover:text-danger hover:bg-danger/10 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="primary" className="flex-1" onClick={save} disabled={!form.title?.trim()}>
            {editor.mode === "create" ? "Create task" : "Save changes"}
          </Button>
          <Button variant="ghost" onClick={() => setEditor(null)}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
