# Spec 0000 — Study-room booking rules

Status: Approved · Owner: roombook team · Updated: November 2026

## Background
The Kinneret library offers 8 study rooms to students. Until now, bookings were managed on a paper form at the desk. roombook replaces the form with a command-line tool and, later, an API. All times are local time (Israel), with no time-zone conversions.

## The rules

| Code | Rule | Error code |
| --- | --- | --- |
| R1 | Opening hours: Sun–Thu 08:00–22:00, Fri 08:00–14:00, Saturday closed. A booking must start and end on the same day and within opening hours. | `OUTSIDE_HOURS` |
| R2 | Booking length: at least 30 minutes and at most 3 hours. Start and end only on half-hour boundaries (:00 or :30). | `BAD_LENGTH`, `NOT_ON_SLOT` |
| R3 | No overlap between two active bookings in the same room. **Back-to-back bookings are allowed**: 10:00–11:00 and 11:00–12:00 do not overlap. | `OVERLAP` |
| R4 | A student may hold up to 2 active bookings on a single day (across all rooms combined). | `DAILY_LIMIT` |
| R5 | Group size may not exceed the room's capacity. | `OVER_CAPACITY` |

A cancelled booking (`cancelled: true`) is not counted by any rule.

## Acceptance criteria (examples)
- **Given** room 101 is taken 10:00–11:00 on Sunday, **when** a student books 11:00–12:00, **then** the booking is made.
- **Given** a Friday, **when** a student books 13:30–14:30, **then** an `OUTSIDE_HOURS` error is returned.
- **Given** a student with two bookings on Sunday, **when** they book a third on the same day, **then** a `DAILY_LIMIT` error is returned.
- **Given** room 102 with capacity 2, **when** a group of 3 books it, **then** an `OVER_CAPACITY` error is returned.

## Non-goals
- Payment, librarian approval, recurring bookings (see issue 004), waitlist (see issue 003).
- Permissions and identity: `student_id` is a free-form string at this stage.
