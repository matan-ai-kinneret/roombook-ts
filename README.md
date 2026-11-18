# roombook · הזמנת חדרי לימוד בספריית כנרת

מאגר התרגול של סדנת **פיתוח תוכנה בעזרת Claude** (מתן פתרונות טכנולוגיים · Matan AI).
גרסת TypeScript (Node 20+). גרסה זהה ב-Python נמצאת במאגר `roombook-py`.

## התקנה
```bash
npm install
```
נדרש Node.js 20 ומעלה. בזמן ריצה אין תלויות חיצוניות (רק `tsx`, `typescript`, `vitest` לפיתוח).

## בדיקות ו-lint
```bash
npm test           # כל הבדיקות (vitest)
npm run lint       # בדיקת טיפוסים (tsc --noEmit)
```

## שימוש ב-CLI
```bash
npm start -- rooms
npm start -- list --room R101 --day 2026-12-06
npm start -- free --room R101 --day 2026-12-06 --minutes 60
npm start -- book --room R101 --student 315000111 --start 2026-12-06T12:00 --end 2026-12-06T13:00 --group 3
npm start -- cancel --id a1b2c3d4
```

## מפת הפרויקט
```
src/
  models.ts    Room, Booking, עזרי תאריכים (at, day, hhmm)
  rules.ts     כללי R1–R5: openingHours, overlaps, validateBooking
  service.ts   BookingService: createBooking / cancelBooking / listBookings / freeSlots
  store.ts     JsonStore (קבצים) ו-MemoryStore (בדיקות)
  cli.ts       שורת הפקודה
data/          rooms.json, bookings.json — לא עורכים ידנית
tests/         vitest
docs/specs/    מפרטים. 0000 = כללי ההזמנה, TEMPLATE.md = תבנית למפרט חדש
docs/adr/      החלטות ארכיטקטורה
docs/issues/   משימות הסדנה (001–004)
```

## משימות הסדנה
| issue | מפגש | נושא |
| --- | --- | --- |
| 001 | 2 | באג: הזמנות צמודות נדחות |
| 002 | 2 (בונוס) | באג: שעות שישי |
| 003 | 4 | פיצ'ר: רשימת המתנה (מפרט + TDD) |
| 004 | 5 | פיצ'ר: הזמנה שבועית קבועה (בזוגות, PR) |

`CLAUDE.md.example` הוא שלד — במפגש 3 הופכים אותו ל-`CLAUDE.md` אמיתי.
