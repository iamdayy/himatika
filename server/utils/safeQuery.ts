import crypto from "crypto";

/** Escape user input before embedding into a $regex (ReDoS / injection). */
export function escapeRegex(input: string): string {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Clamp a numeric query param to sane bounds; falls back on NaN. */
export function clampInt(
  value: unknown,
  { min = 1, max = 100, fallback = min }: { min?: number; max?: number; fallback?: number } = {}
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** JSON.parse that never throws: returns `fallback` on malformed input. */
export function safeJsonParse<T = any>(raw: unknown, fallback: T): T {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw !== "string") return raw as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
