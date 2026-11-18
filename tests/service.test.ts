import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "../src/cli.js";
import { day, hhmm } from "../src/models.js";
import { BookingError, UnknownRoom } from "../src/service.js";
import { JsonStore } from "../src/store.js";
import { SATURDAY, SUNDAY, booking, rooms, service, t } from "./helpers.js";

const roomsJson = () =>
  JSON.stringify(rooms().map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, floor: r.floor, has_screen: r.hasScreen })));

describe("BookingService", () => {
  it("saves a new booking", () => {
    const svc = service();
    const b = svc.createBooking("R101", "s1", t(SUNDAY, "10:00"), t(SUNDAY, "11:00"));
    expect(svc.listBookings("R101", day(SUNDAY)).map((x) => x.id)).toEqual([b.id]);
  });

  it("throws BookingError with codes", () => {
    const svc = service();
    try {
      svc.createBooking("R101", "s1", t(SATURDAY, "10:00"), t(SATURDAY, "11:00"));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(BookingError);
      expect((e as BookingError).codes).toContain("OUTSIDE_HOURS");
    }
  });

  it("throws on an unknown room", () => {
    expect(() => service().createBooking("R999", "s1", t(SUNDAY, "10:00"), t(SUNDAY, "11:00"))).toThrow(UnknownRoom);
  });

  it("cancels once", () => {
    const svc = service();
    const b = svc.createBooking("R101", "s1", t(SUNDAY, "10:00"), t(SUNDAY, "11:00"));
    expect(svc.cancelBooking(b.id)).toBe(true);
    expect(svc.cancelBooking(b.id)).toBe(false);
    expect(svc.listBookings("R101", day(SUNDAY))).toEqual([]);
  });

  it("lists bookings sorted by start", () => {
    const svc = service();
    svc.createBooking("R101", "s1", t(SUNDAY, "15:00"), t(SUNDAY, "16:00"));
    svc.createBooking("R101", "s2", t(SUNDAY, "09:00"), t(SUNDAY, "10:00"));
    expect(svc.listBookings("R101", day(SUNDAY)).map((b) => hhmm(b.start))).toEqual(["09:00", "15:00"]);
  });

  it("returns 27 one-hour slots on an empty Sunday", () => {
    const slots = service().freeSlots("R101", day(SUNDAY), 60);
    expect(hhmm(slots[0].start)).toBe("08:00");
    expect(hhmm(slots[slots.length - 1].end)).toBe("22:00");
    expect(slots).toHaveLength(27);
  });

  it("skips taken time in free slots", () => {
    const svc = service();
    svc.createBooking("R101", "s1", t(SUNDAY, "10:00"), t(SUNDAY, "11:00"));
    const starts = new Set(svc.freeSlots("R101", day(SUNDAY), 60).map((s) => hhmm(s.start)));
    expect(starts.has("10:30")).toBe(false);
    expect(starts.has("13:00")).toBe(true);
  });

  it("has no slots on Saturday", () => {
    expect(service().freeSlots("R101", day(SATURDAY), 60)).toEqual([]);
  });
});

describe("JsonStore and CLI", () => {
  it("round-trips bookings", () => {
    const dir = mkdtempSync(join(tmpdir(), "roombook-"));
    writeFileSync(join(dir, "rooms.json"), roomsJson());
    const store = new JsonStore(dir);
    store.saveBookings([booking()]);
    expect(store.loadBookings()[0].start.getTime()).toBe(t(SUNDAY, "10:00").getTime());
    expect(store.loadRooms()).toHaveLength(3);
  });

  it("books and lists from the command line", () => {
    const dir = mkdtempSync(join(tmpdir(), "roombook-"));
    writeFileSync(join(dir, "rooms.json"), roomsJson());
    const lines: string[] = [];
    const out = (s: string) => lines.push(s);
    const code = main(["book", "--data", dir, "--room", "R101", "--student", "s1",
      "--start", `${SUNDAY}T10:00`, "--end", `${SUNDAY}T11:00`], out, out);
    expect(code).toBe(0);
    main(["list", "--data", dir, "--room", "R101", "--day", SUNDAY], out, out);
    expect(lines.join("\n")).toContain("10:00-11:00");
  });
});
