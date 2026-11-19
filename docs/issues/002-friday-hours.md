# #2 · The system allows bookings on Friday after 14:00

**Labels:** bug · **Opened by:** Avi (shift manager)

## What happened
On Friday we received three bookings for 15:00–17:00. The library closes at 14:00 on Fridays, and the students arrived at a locked door.

## How to reproduce
```
roombook book --room R202 --student 315000444 --start 2026-12-04T15:00 --end 2026-12-04T16:00
```
(2026-12-04 is a Friday.)

## Expected
An `OUTSIDE_HOURS` error, per rule R1 in spec 0000.

## Actual
`נקבע: …` (booked) — the booking was saved.

## Notes
`roombook free --day 2026-12-04` shows free windows until 22:00.
