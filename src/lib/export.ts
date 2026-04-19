import type { Task, Note, PomodoroSession } from "@/types/models";
import { format } from "date-fns";

export async function exportPDF(opts: {
  tasks: Task[];
  sessions: PomodoroSession[];
  scope: "today" | "week" | "all";
}) {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF();
  const title = `Flow — ${opts.scope[0].toUpperCase() + opts.scope.slice(1)} Report`;
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(format(new Date(), "PPPP"), 14, 30);

  const rows = opts.tasks.map((t) => [
    format(new Date(t.startAt), "PP p"),
    t.title,
    `${t.durationMin}m`,
    t.completed ? "✓ Done" : "—",
  ]);

  (doc as any).autoTable({
    startY: 40,
    head: [["When", "Task", "Duration", "Status"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [0, 122, 255], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 247] },
  });

  const done = opts.tasks.filter((t) => t.completed).length;
  const total = opts.tasks.length;
  const mins = opts.sessions.filter((s) => s.kind === "work").reduce((a, s) => a + s.durationMin, 0);
  const y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(`Completed: ${done} / ${total}`, 14, y);
  doc.text(`Focus minutes: ${mins}`, 14, y + 8);

  doc.save(`flow-${opts.scope}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export async function exportCSV(kind: "tasks" | "notes" | "sessions", rows: Task[] | Note[] | PomodoroSession[]) {
  const Papa = (await import("papaparse")).default;
  const csv = Papa.unparse(rows as any[]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flow-${kind}-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
