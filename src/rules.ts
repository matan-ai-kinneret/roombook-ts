// Booking rules R1–R5. See docs/specs/0000-booking-rules.md.
import { type Booking, type Room, dayKey, minutesBetween } from "./models.js";

export const SLOT_MINUTES = 30;
export const MIN_MINUTES = 30;
export const MAX_MINUTES = 180;
export const DAILY_LIMIT = 2;

export type ErrorCode =
  | "OUTSIDE_HOURS"
  | "BAD_LENGTH"
  | "NOT_ON_SLOT"
  | "OVERLAP"
  | "DAILY_LIMIT"
  | "OVER_CAPACITY";

const SATURDAY = 6; // Date.getDay(): Sunday=0 ... Saturday=6

/** Opening hours in minutes from midnight, or null when the library is closed (R1). */
export function openingHours(d: Date): { open: number; close: number } | null {
  if (d.getDay() === SATURDAY) return null;
  return { open: 8 * 60, close: 22 * 60 };
}

/** True when two time ranges share at least one minute (R3). */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const onSlot = (d: Date) => d.getMinutes() % SLOT_MINUTES === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;

export function validateBooking(
  booking: Booking,
  room: Room,
  existing: Booking[],
  groupSize: number = booking.groupSize,
): ErrorCode[] {
  const errors: ErrorCode[] = [];

  // R1 — opening hours
  const hours = openingHours(booking.start);
  if (
    hours === null ||
    dayKey(booking.start) !== dayKey(booking.end) ||
    minuteOfDay(booking.start) < hours.open ||
    minuteOfDay(booking.end) > hours.close
  ) {
    errors.push("OUTSIDE_HOURS");
  }

  // R2 — length and 30-minute boundaries
  const length = minutesBetween(booking.start, booking.end);
  if (length < MIN_MINUTES || length > MAX_MINUTES) errors.push("BAD_LENGTH");
  if (!onSlot(booking.start) || !onSlot(booking.end)) errors.push("NOT_ON_SLOT");

  const active = existing.filter((b) => !b.cancelled && b.id !== booking.id);

  // R3 — no overlap in the same room
  if (active.some((b) => b.roomId === booking.roomId && overlaps(booking.start, booking.end, b.start, b.end))) {
    errors.push("OVERLAP");
  }

  // R4 — at most two bookings per student per day
  const sameDay = active.filter((b) => b.studentId === booking.studentId && dayKey(b.start) === dayKey(booking.start));
  if (sameDay.length >= DAILY_LIMIT) errors.push("DAILY_LIMIT");

  // R5 — capacity
  if (groupSize > room.capacity) errors.push("OVER_CAPACITY");

  return errors;
}
