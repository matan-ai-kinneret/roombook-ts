import { describe, expect, it } from "vitest";
import { overlaps, validateBooking } from "../src/rules.js";
import { FRIDAY, SATURDAY, SUNDAY, booking, rooms, t } from "./helpers.js";

const r101 = rooms()[0];

describe("overlaps", () => {
  it("detects partial overlap", () => {
    expect(overlaps(t(SUNDAY, "10:00"), t(SUNDAY, "11:00"), t(SUNDAY, "10:30"), t(SUNDAY, "11:30"))).toBe(true);
  });
  it("is false when there is a gap", () => {
    expect(overlaps(t(SUNDAY, "10:00"), t(SUNDAY, "11:00"), t(SUNDAY, "11:30"), t(SUNDAY, "12:00"))).toBe(false);
  });
  it("detects containment", () => {
    expect(overlaps(t(SUNDAY, "09:00"), t(SUNDAY, "12:00"), t(SUNDAY, "10:00"), t(SUNDAY, "10:30"))).toBe(true);
  });
});

describe("validateBooking", () => {
  it("accepts a valid booking", () => {
    expect(validateBooking(booking(), r101, [])).toEqual([]);
  });
  it("rejects Saturday", () => {
    expect(validateBooking(booking({ day: SATURDAY }), r101, [])).toContain("OUTSIDE_HOURS");
  });
  it("rejects before opening", () => {
    expect(validateBooking(booking({ start: "07:30", end: "08:30" }), r101, [])).toContain("OUTSIDE_HOURS");
  });
  it("rejects after closing on a weekday", () => {
    expect(validateBooking(booking({ start: "21:30", end: "22:30" }), r101, [])).toContain("OUTSIDE_HOURS");
  });
  it("accepts Friday morning", () => {
    expect(validateBooking(booking({ day: FRIDAY, start: "09:00", end: "10:00" }), r101, [])).toEqual([]);
  });
  it("rejects zero length", () => {
    expect(validateBooking(booking({ start: "10:00", end: "10:00" }), r101, [])).toContain("BAD_LENGTH");
  });
  it("rejects more than 3 hours", () => {
    expect(validateBooking(booking({ start: "09:00", end: "12:30" }), r101, [])).toContain("BAD_LENGTH");
  });
  it("requires half-hour boundaries", () => {
    expect(validateBooking(booking({ start: "10:15", end: "11:15" }), r101, [])).toContain("NOT_ON_SLOT");
  });
  it("rejects overlap in the same room", () => {
    const existing = [booking({ id: "old", student: "s2", start: "10:30", end: "12:00" })];
    expect(validateBooking(booking(), r101, existing)).toContain("OVERLAP");
  });
  it("allows the same time in another room", () => {
    expect(validateBooking(booking(), r101, [booking({ id: "old", room: "R201", student: "s2" })])).toEqual([]);
  });
  it("ignores cancelled bookings", () => {
    const old = { ...booking({ id: "old", student: "s2" }), cancelled: true };
    expect(validateBooking(booking(), r101, [old])).toEqual([]);
  });
  it("limits a student to two bookings a day", () => {
    const existing = [
      booking({ id: "a", room: "R201", start: "08:00", end: "09:00" }),
      booking({ id: "b", room: "R201", start: "13:00", end: "14:00" }),
    ];
    expect(validateBooking(booking({ start: "16:00", end: "17:00" }), r101, existing)).toContain("DAILY_LIMIT");
  });
  it("rejects a group larger than the room", () => {
    expect(validateBooking(booking({ size: 5 }), r101, [])).toContain("OVER_CAPACITY");
  });
});
