/**
 * Map a category's accent color (or id, as a fallback) to one of the
 * 8 pastel tokens defined in globals.css. Stable across renders.
 */
const TOKEN_COUNT = 8;

const DIRECT: Record<string, number> = {
  // Work — baby blue
  "#0A84FF": 1,
  "#0a84ff": 1,
  "#007AFF": 1,
  "#007aff": 1,
  "#64D2FF": 1,
  "#64d2ff": 1,
  // Health / success — mint
  "#30D158": 2,
  "#30d158": 2,
  // Study — soft yellow
  "#FFD60A": 3,
  "#ffd60a": 3,
  // Warning / peach
  "#FF9F0A": 4,
  "#ff9f0a": 4,
  // Personal — lavender
  "#BF5AF2": 5,
  "#bf5af2": 5,
  // Rose
  "#FF375F": 6,
  "#ff375f": 6,
  "#FF3B30": 6,
  "#ff3b30": 6,
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function pastelIndex(input: { color?: string; id?: string } | null | undefined): number {
  if (!input) return 7;
  if (input.color && DIRECT[input.color] != null) return DIRECT[input.color];
  const key = input.color ?? input.id ?? "x";
  return (hashString(key) % TOKEN_COUNT) + 1;
}

export function pastelVar(input: { color?: string; id?: string } | null | undefined): string {
  return `var(--event-${pastelIndex(input)})`;
}
