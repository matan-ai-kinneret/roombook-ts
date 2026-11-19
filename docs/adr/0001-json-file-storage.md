# ADR 0001 — JSON file storage

Status: Accepted · Date: November 2026

## Context
roombook starts as a command-line tool for use at the library desk and in the workshop. There are 8 rooms and dozens of bookings per day. At this stage there is no need for concurrent access from multiple machines, and we want every student to be able to run the project without installing a database.

## Decision
Data is stored in two files: `data/rooms.json` (read-only) and `data/bookings.json`. All access goes through the `store` layer (`JsonStore` / `MemoryStore`), so switching to a database affects only that file. Tests use `MemoryStore`.

## Consequences
- Easy to set up and debug: you can open the file and see the state.
- No locking: two processes writing at the same time may overwrite each other. Acceptable at this stage.
- `data/*.json` is never edited by hand or by an agent — only through the CLI or the tests.
- When we move to multi-user access (API), we will open a new ADR for migrating to SQLite.
