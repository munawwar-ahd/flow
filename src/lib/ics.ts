import type { CalendarEvent } from "@/types/models";
import { uid } from "./db";

function parseICSDate(value: string): { date: string; allDay: boolean } {
  const s = value.replace(/[^0-9TZ]/g, "");
  if (s.length === 8) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return { date: `${y}-${m}-${d}T00:00:00.000Z`, allDay: true };
  }
  const y = s.slice(0, 4);
  const m = s.slice(4, 6);
  const d = s.slice(6, 8);
  const hh = s.slice(9, 11);
  const mm = s.slice(11, 13);
  const ss = s.slice(13, 15);
  const z = s.endsWith("Z");
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}${z ? "Z" : ""}`;
  return { date: new Date(iso).toISOString(), allDay: false };
}

function unfold(raw: string): string[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function unescape(s: string) {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

export function parseICS(raw: string): CalendarEvent[] {
  const lines = unfold(raw);
  const events: CalendarEvent[] = [];
  let cur: Partial<CalendarEvent> | null = null;
  let allDay = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = { id: uid(), source: "ics", title: "", startAt: "", endAt: "", allDay: false };
      allDay = false;
      continue;
    }
    if (line === "END:VEVENT" && cur) {
      if (cur.startAt && cur.title) {
        if (!cur.endAt) cur.endAt = cur.startAt;
        cur.allDay = allDay;
        events.push(cur as CalendarEvent);
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const head = line.slice(0, colon);
    const val = line.slice(colon + 1);
    const key = head.split(";")[0];
    switch (key) {
      case "SUMMARY":
        cur.title = unescape(val);
        break;
      case "DESCRIPTION":
        cur.description = unescape(val);
        break;
      case "LOCATION":
        cur.location = unescape(val);
        break;
      case "DTSTART": {
        const p = parseICSDate(val);
        cur.startAt = p.date;
        allDay = p.allDay;
        break;
      }
      case "DTEND": {
        const p = parseICSDate(val);
        cur.endAt = p.date;
        break;
      }
    }
  }
  return events;
}
