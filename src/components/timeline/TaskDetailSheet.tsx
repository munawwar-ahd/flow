"use client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, Clock, Edit3, FileText, Play, Tag, Trash2, Repeat, Bell } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { useUI } from "@/stores/ui";
import { useTasks } from "@/stores/tasks";
import { useNotes } from "@/stores/notes";
import { usePomodoro } from "@/stores/pomodoro";

export function TaskDetailSheet() {
  const router = useRouter();
  const activeTaskId = useUI((s) => s.activeTaskId);
  const setActive = useUI((s) => s.setActiveTaskId);
  const setEditor = useUI((s) => s.setTaskEditor);
  const tasks = useTasks((s) => s.tasks);
  const update = useTasks((s) => s.update);
  const remove = useTasks((s) => s.remove);
  const toggle = useTasks((s) => s.toggle);
  const notes = useNotes((s) => s.notes);
  const categories = useUI((s) => s.categories);
  const pom = usePomodoro((s) => s);

  const task = tasks.find((t) => t.id === activeTaskId);
  const open = !!task;

  if (!task) {
    return <Modal open={false} onClose={() => setActive(null)} hideHeader>{null}</Modal>;
  }

  const cat = categories.find((c) => c.id === task.categoryId);
  const linkedNote = notes.find((n) => n.id === task.linkedNoteId);
  const referenced = notes.filter((n) => n.linkedTaskIds.includes(task.id));
  const end = new Date(new Date(task.startAt).getTime() + task.durationMin * 60_000);

  return (
    <Modal
      open={open}
      onClose={() => setActive(null)}
      title={task.title}
      widthClass="w-[min(92vw,520px)]"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggle(task.id)}
            className="flex items-center gap-2 rounded-full px-3 h-8 bg-bg-secondary hover:bg-bg-primary border border-separator text-caption"
          >
            <span
              className={
                "w-4 h-4 rounded-full flex items-center justify-center border " +
                (task.completed ? "bg-success border-success" : "border-text-tertiary")
              }
            >
              {task.completed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </span>
            {task.completed ? "Completed" : "Mark done"}
          </button>
          {cat && (
            <span
              className="inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-caption border"
              style={{
                color: cat.color,
                borderColor: cat.color + "55",
                background: cat.color + "15",
              }}
            >
              <Tag className="w-3 h-3" />
              {cat.name}
            </span>
          )}
        </div>

        <div className="rounded-card border border-separator divide-y divide-separator bg-bg-secondary/50">
          <Row
            icon={<Clock className="w-4 h-4" />}
            label="When"
            value={`${format(new Date(task.startAt), "EEE, d MMM · h:mm a")} — ${format(end, "h:mm a")}`}
            hint={`${task.durationMin} min`}
          />
          {task.reminderMin != null && (
            <Row
              icon={<Bell className="w-4 h-4" />}
              label="Reminder"
              value={`${task.reminderMin} min before`}
            />
          )}
          {task.recurrence && (
            <Row
              icon={<Repeat className="w-4 h-4" />}
              label="Repeats"
              value={
                task.recurrence.freq +
                (task.recurrence.until
                  ? ` until ${format(new Date(task.recurrence.until), "PP")}`
                  : "")
              }
            />
          )}
        </div>

        {task.notes && (
          <div>
            <div className="text-micro uppercase tracking-wide text-text-tertiary mb-1.5">Notes</div>
            <p className="text-body text-text-secondary whitespace-pre-wrap">{task.notes}</p>
          </div>
        )}

        {task.subtasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-micro uppercase tracking-wide text-text-tertiary">Subtasks</div>
            {task.subtasks.map((s, i) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="flow-check"
                  checked={s.done}
                  onChange={() => {
                    const next = [...task.subtasks];
                    next[i] = { ...next[i], done: !next[i].done };
                    update(task.id, { subtasks: next });
                  }}
                />
                <span className={s.done ? "line-through text-text-tertiary" : "text-body"}>
                  {s.title}
                </span>
              </label>
            ))}
          </div>
        )}

        {(linkedNote || referenced.length > 0) && (
          <div className="space-y-2">
            <div className="text-micro uppercase tracking-wide text-text-tertiary">Linked</div>
            {linkedNote && (
              <button
                onClick={() => {
                  setActive(null);
                  router.push("/notes?id=" + linkedNote.id);
                }}
                className="w-full flex items-center gap-2 rounded-btn px-3 py-2 bg-bg-secondary hover:bg-bg-primary border border-separator text-left"
              >
                <FileText className="w-4 h-4 text-text-secondary" />
                <span className="text-body truncate">{linkedNote.title}</span>
              </button>
            )}
            {referenced.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setActive(null);
                  router.push("/notes?id=" + n.id);
                }}
                className="w-full flex items-center gap-2 rounded-btn px-3 py-2 bg-bg-secondary hover:bg-bg-primary border border-separator text-left"
              >
                <FileText className="w-4 h-4 text-text-secondary" />
                <span className="text-body truncate">Referenced in: {n.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              pom.setLinkedTask(task.id);
              setActive(null);
              router.push("/focus");
            }}
          >
            <Play className="w-4 h-4" />
            Start pomodoro
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setActive(null);
              setEditor({ mode: "edit", initial: task });
            }}
            aria-label="Edit"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              remove(task.id);
              setActive(null);
            }}
            aria-label="Delete"
            className="text-danger"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Row({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="text-text-tertiary">{icon}</span>
      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="text-micro uppercase tracking-wide text-text-tertiary">{label}</div>
          <div className="text-body truncate">{value}</div>
        </div>
        {hint && <span className="text-caption text-text-secondary">{hint}</span>}
      </div>
    </div>
  );
}
