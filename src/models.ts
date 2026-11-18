// Domain models for roombook — study-room booking at the Kinneret library.

export interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: number;
  hasScreen: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  studentId: string;
  start: Date; // local time
  end: Date; // local time
  groupSize: number;
  cancelled: boolean;
}

/** Parse "YYYY-MM-DDTHH:MM" as local time (no time-zone math, like the Python version). */
export function at(isoLocal: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(isoLocal);
  if (!m) throw new Error(`bad datetime: ${isoLocal} (expected YYYY-MM-DDTHH:MM)`);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

/** Parse "YYYY-MM-DD" as a local date at midnight. */
export function day(isoDay: string): Date {
  return at(`${isoDay}T00:00`);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function hhmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toLocalIso(d: Date): string {
  return `${dayKey(d)}T${hhmm(d)}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}
