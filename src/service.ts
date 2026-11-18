// Application service: create, cancel and query bookings.
import { randomUUID } from "node:crypto";
import { type Booking, type Room, dayKey } from "./models.js";
import { type ErrorCode, SLOT_MINUTES, openingHours, validateBooking } from "./rules.js";
import type { Store } from "./store.js";

export class BookingError extends Error {
  constructor(public codes: ErrorCode[]) {
    super(codes.join(", "));
    this.name = "BookingError";
  }
}

export class UnknownRoom extends Error {
  constructor(public roomId: string) {
    super(`unknown room: ${roomId}`);
    this.name = "UnknownRoom";
  }
}

export class BookingService {
  constructor(private store: Store) {}

  rooms(): Room[] {
    return this.store.loadRooms();
  }

  room(roomId: string): Room {
    const r = this.rooms().find((x) => x.id === roomId);
    if (!r) throw new UnknownRoom(roomId);
    return r;
  }

  createBooking(roomId: string, studentId: string, start: Date, end: Date, groupSize = 1): Booking {
    const room = this.room(roomId);
    const existing = this.store.loadBookings();
    const booking: Booking = {
      id: randomUUID().replace(/-/g, "").slice(0, 8),
      roomId,
      studentId,
      start,
      end,
      groupSize,
      cancelled: false,
    };
    const errors = validateBooking(booking, room, existing, groupSize);
    if (errors.length) throw new BookingError(errors);
    existing.push(booking);
    this.store.saveBookings(existing);
    return booking;
  }

  cancelBooking(bookingId: string): boolean {
    const bookings = this.store.loadBookings();
    const b = bookings.find((x) => x.id === bookingId && !x.cancelled);
    if (!b) return false;
    b.cancelled = true;
    this.store.saveBookings(bookings);
    return true;
  }

  listBookings(roomId: string, day: Date): Booking[] {
    return this.store
      .loadBookings()
      .filter((b) => b.roomId === roomId && dayKey(b.start) === dayKey(day) && !b.cancelled)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /** Every start time (30-minute steps) where a booking of `minutes` would not overlap. */
  freeSlots(roomId: string, day: Date, minutes: number): Array<{ start: Date; end: Date }> {
    const room = this.room(roomId);
    const hours = openingHours(day);
    if (!hours) return [];
    const taken = this.listBookings(roomId, day);
    const base = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const slots: Array<{ start: Date; end: Date }> = [];
    for (let m = hours.open; m + minutes <= hours.close; m += SLOT_MINUTES) {
      const start = new Date(base.getTime() + m * 60000);
      const end = new Date(start.getTime() + minutes * 60000);
      const probe: Booking = { id: "probe", roomId, studentId: "probe", start, end, groupSize: 1, cancelled: false };
      if (!validateBooking(probe, room, taken).includes("OVERLAP")) slots.push({ start, end });
    }
    return slots;
  }
}
