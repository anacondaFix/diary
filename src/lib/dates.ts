import { TZDate } from "@date-fns/tz";

export const TZ_COOKIE = "tz";
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Returns `tz` if it is a valid IANA zone, otherwise "UTC". */
export function safeTimeZone(tz: string | undefined): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Formats a date as YYYY-MM-DD using its own (possibly TZDate) calendar fields. */
function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's calendar date (YYYY-MM-DD) in the given time zone. */
export function todayInZone(tz: string): string {
  return toDateString(TZDate.tz(tz));
}

/**
 * Validates a `?date=` value. Falls back to today in `tz` when it is
 * missing, malformed, or not a real calendar date (e.g. 2026-02-31).
 */
export function parseDateParam(
  value: string | string[] | undefined,
  tz: string,
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const match = raw ? DATE_RE.exec(raw) : null;
  if (match) {
    const [, y, m, d] = match.map(Number);
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (
      probe.getUTCFullYear() === y &&
      probe.getUTCMonth() === m - 1 &&
      probe.getUTCDate() === d
    ) {
      return raw!;
    }
  }
  return todayInZone(tz);
}

/** Half-open [start, end) instant range covering a calendar day in `tz`. */
export function dayRange(dateStr: string, tz: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new TZDate(y, m - 1, d, tz);
  const end = new TZDate(y, m - 1, d + 1, tz);
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}

/** Parses YYYY-MM-DD into a local-midnight Date (for the calendar UI). */
export function dateFromString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export { toDateString };
