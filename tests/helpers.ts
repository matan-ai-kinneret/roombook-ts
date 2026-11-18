import { type Booking, type Room, at } from "../src/models.js";
import { BookingService } from "../src/service.js";
import { MemoryStore } from "../src/store.js";

export const SUNDAY = "2026-12-06";
export const FRIDAY = "2026-12-04";
export const SATURDAY = "2026-12-05";

export const t = (d: string, hm: string) => at(`${d}T${hm}`);

export const rooms = (): Room[] => [
  { id: "R101", name: "חדר 101", capacity: 4, floor: 1, hasScreen: true },
  { id: "R102", name: "חדר 102", capacity: 2, floor: 1, hasScreen: false },
  { id: "R201", name: "חדר 201", capacity: 8, floor: 2, hasScreen: true },
];

export const service = () => new BookingService(new MemoryStore(rooms()));

export function booking(over: Partial<{ id: string; room: string; student: string; day: string; start: string; end: string; size: number }> = {}): Booking {
  const o = { id: "b1", room: "R101", student: "s1", day: SUNDAY, start: "10:00", end: "11:00", size: 1, ...over };
  return { id: o.id, roomId: o.room, studentId: o.student, start: t(o.day, o.start), end: t(o.day, o.end), groupSize: o.size, cancelled: false };
}
