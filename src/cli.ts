// Command line: roombook rooms | list | free | book | cancel
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { at, day, dayKey, hhmm } from "./models.js";
import { BookingError, BookingService, UnknownRoom } from "./service.js";
import { JsonStore } from "./store.js";

const MESSAGES: Record<string, string> = {
  OUTSIDE_HOURS: "מחוץ לשעות הפתיחה של הספרייה",
  BAD_LENGTH: "אורך הזמנה חייב להיות בין 30 דקות ל-3 שעות",
  NOT_ON_SLOT: "הזמנה מתחילה ומסתיימת רק בחצאי שעות (‎:00 / ‎:30)",
  OVERLAP: "החדר כבר תפוס בזמן הזה",
  DAILY_LIMIT: "אפשר להחזיק עד 2 הזמנות ביום",
  OVER_CAPACITY: "הקבוצה גדולה מקיבולת החדר",
};

const USAGE = `roombook <rooms|list|free|book|cancel> [options]
  list   --room R101 --day 2026-12-06
  free   --room R101 --day 2026-12-06 [--minutes 60]
  book   --room R101 --student 315000111 --start 2026-12-06T12:00 --end 2026-12-06T13:00 [--group 3]
  cancel --id a1b2c3d4
  --data <dir>   data folder (default: data)`;

export function main(argv: string[] = process.argv.slice(2), out = console.log, err = console.error): number {
  const [cmd, ...rest] = argv;
  const { values: v } = parseArgs({
    args: rest,
    options: {
      data: { type: "string", default: "data" },
      room: { type: "string" },
      day: { type: "string" },
      minutes: { type: "string", default: "60" },
      student: { type: "string" },
      start: { type: "string" },
      end: { type: "string" },
      group: { type: "string", default: "1" },
      id: { type: "string" },
    },
  });
  const need = (name: keyof typeof v) => {
    const value = v[name];
    if (typeof value !== "string" || !value) throw new Error(`missing --${String(name)}`);
    return value;
  };
  const svc = new BookingService(new JsonStore(v.data));
  try {
    switch (cmd) {
      case "rooms":
        for (const r of svc.rooms()) out(`${r.id}\t${r.name}\tקומה ${r.floor}\tעד ${r.capacity}\t${r.hasScreen ? "מסך" : "—"}`);
        break;
      case "list":
        for (const b of svc.listBookings(need("room"), day(need("day"))))
          out(`${b.id}\t${hhmm(b.start)}-${hhmm(b.end)}\t${b.studentId}\t${b.groupSize}`);
        break;
      case "free":
        for (const s of svc.freeSlots(need("room"), day(need("day")), Number(v.minutes)))
          out(`${hhmm(s.start)}-${hhmm(s.end)}`);
        break;
      case "book": {
        const b = svc.createBooking(need("room"), need("student"), at(need("start")), at(need("end")), Number(v.group));
        out(`נקבע: ${b.id} · ${b.roomId} · ${dayKey(b.start)} ${hhmm(b.start)}-${hhmm(b.end)}`);
        break;
      }
      case "cancel":
        out(svc.cancelBooking(need("id")) ? "בוטל" : "לא נמצאה הזמנה פעילה עם המזהה הזה");
        break;
      default:
        err(USAGE);
        return 1;
    }
  } catch (e) {
    if (e instanceof BookingError) {
      for (const c of e.codes) err(`שגיאה ${c}: ${MESSAGES[c] ?? c}`);
      return 2;
    }
    if (e instanceof UnknownRoom) {
      err(`חדר לא קיים: ${e.roomId}`);
      return 2;
    }
    throw e;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
