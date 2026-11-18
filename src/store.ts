// Storage. JSON files on disk (see docs/adr/0001-json-file-storage.md) and an in-memory store for tests.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type Booking, type Room, at, toLocalIso } from "./models.js";

export interface Store {
  loadRooms(): Room[];
  loadBookings(): Booking[];
  saveBookings(bookings: Booking[]): void;
}

export class MemoryStore implements Store {
  private rooms: Room[];
  private bookings: Booking[];
  constructor(rooms: Room[] = [], bookings: Booking[] = []) {
    this.rooms = [...rooms];
    this.bookings = bookings.map((b) => ({ ...b }));
  }
  loadRooms(): Room[] {
    return [...this.rooms];
  }
  loadBookings(): Booking[] {
    return this.bookings.map((b) => ({ ...b }));
  }
  saveBookings(bookings: Booking[]): void {
    this.bookings = bookings.map((b) => ({ ...b }));
  }
}

interface RoomJson { id: string; name: string; capacity: number; floor: number; has_screen?: boolean }
interface BookingJson {
  id: string; room_id: string; student_id: string; start: string; end: string;
  group_size?: number; cancelled?: boolean;
}

export class JsonStore implements Store {
  constructor(private dataDir = "data") {}

  private get roomsPath() { return join(this.dataDir, "rooms.json"); }
  private get bookingsPath() { return join(this.dataDir, "bookings.json"); }

  loadRooms(): Room[] {
    const raw = JSON.parse(readFileSync(this.roomsPath, "utf8")) as RoomJson[];
    return raw.map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, floor: r.floor, hasScreen: !!r.has_screen }));
  }

  loadBookings(): Booking[] {
    if (!existsSync(this.bookingsPath)) return [];
    const text = readFileSync(this.bookingsPath, "utf8").trim() || "[]";
    return (JSON.parse(text) as BookingJson[]).map((b) => ({
      id: b.id,
      roomId: b.room_id,
      studentId: b.student_id,
      start: at(b.start),
      end: at(b.end),
      groupSize: b.group_size ?? 1,
      cancelled: !!b.cancelled,
    }));
  }

  saveBookings(bookings: Booking[]): void {
    mkdirSync(this.dataDir, { recursive: true });
    const payload: BookingJson[] = bookings.map((b) => ({
      id: b.id,
      room_id: b.roomId,
      student_id: b.studentId,
      start: toLocalIso(b.start),
      end: toLocalIso(b.end),
      group_size: b.groupSize,
      cancelled: b.cancelled,
    }));
    writeFileSync(this.bookingsPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  }
}
