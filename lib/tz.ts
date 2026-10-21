// Salon-timezone helpers. The server runs in UTC, so anything that shows a
// time or works out "which day / which hour" must say which timezone it means.

export function safeTz(tz?: string | null) {
  const t = tz || "America/New_York";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: t });
    return t;
  } catch {
    return "America/New_York";
  }
}

export function fmtInTz(d: Date, tz: string | null | undefined, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleString("en-US", { ...opts, timeZone: safeTz(tz) });
}

// Calendar parts of an instant as seen in `tz`.
export function partsInTz(d: Date, tz: string | null | undefined) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTz(tz),
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
  });
  const o: Record<string, string> = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: +o.year,
    month: +o.month,
    day: +o.day,
    hour: +o.hour % 24,
    minute: +o.minute,
    dow: dows.indexOf(o.weekday),
    minutesOfDay: (+o.hour % 24) * 60 + +o.minute,
  };
}

// The instant when it is `minutes` after midnight on y-m-d in `tz`.
export function zonedToUtc(year: number, month: number, day: number, minutes: number, tz: string | null | undefined) {
  const wall = Date.UTC(year, month - 1, day, 0, minutes);
  let guess = wall;
  for (let i = 0; i < 2; i++) {
    const p = partsInTz(new Date(guess), tz);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wall - shown;
  }
  return new Date(guess);
}

// Start (inclusive) and end (exclusive) of the salon-local day containing `d`.
export function dayBoundsInTz(d: Date, tz: string | null | undefined) {
  const p = partsInTz(d, tz);
  const start = zonedToUtc(p.year, p.month, p.day, 0, tz);
  const nextDay = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  const end = zonedToUtc(nextDay.getUTCFullYear(), nextDay.getUTCMonth() + 1, nextDay.getUTCDate(), 0, tz);
  return { start, end, dow: p.dow };
}
