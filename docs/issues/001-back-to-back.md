# #1 · Can't book a room right after a previous booking

**Labels:** bug, priority:high · **Opened by:** Noa (library desk)

## What happened
A student tried to book room 101 from 11:00 to 12:00. The room was only taken until 11:00, but the system returned "החדר כבר תפוס בזמן הזה" (the room is already taken at this time). This happens almost every day and creates a line at the desk.

## How to reproduce
```
roombook book --room R101 --student 315000333 --start 2026-12-06T11:00 --end 2026-12-06T12:00
```
(`data/bookings.json` already contains a booking for room 101 from 10:00 to 11:00.)

## Expected
Per spec 0000, rule R3: back-to-back bookings are allowed. The booking should have been made.

## Actual
```
שגיאה OVERLAP: החדר כבר תפוס בזמן הזה
```

## Notes
`roombook free` doesn't show 11:00 as a free slot either. Probably the same cause.
