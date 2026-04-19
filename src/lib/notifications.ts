export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function notify(title: string, body?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {}
}

type ScheduledReminder = { id: string; at: number; title: string; body?: string };
const scheduled = new Map<string, number>();

export function scheduleReminder(r: ScheduledReminder) {
  const delay = r.at - Date.now();
  if (delay <= 0) return;
  cancelReminder(r.id);
  const handle = window.setTimeout(() => {
    notify(r.title, r.body);
    scheduled.delete(r.id);
  }, delay);
  scheduled.set(r.id, handle);
}

export function cancelReminder(id: string) {
  const h = scheduled.get(id);
  if (h) {
    clearTimeout(h);
    scheduled.delete(id);
  }
}
