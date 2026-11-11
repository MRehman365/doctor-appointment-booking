import { addMinutes, format, parse } from "date-fns";
import type { DoctorAvailabilityDocument } from "@/lib/models/DoctorAvailability";
import type { AvailabilityExceptionDocument } from "@/lib/models/AvailabilityException";

export type BookedSlot = {
  startTime: string;
  endTime: string;
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlotsForDate(options: {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  availability: DoctorAvailabilityDocument | null;
  exception?: AvailabilityExceptionDocument | null;
  booked: BookedSlot[];
  bufferMinutes?: number;
  maxDailyAppointments?: number;
}) {
  const {
    date,
    durationMinutes,
    availability,
    exception,
    booked,
    bufferMinutes = availability?.bufferMinutes ?? 0,
    maxDailyAppointments = availability?.maxDailyAppointments ?? 40,
  } = options;

  if (!availability) return [] as string[];

  if (exception && (exception.type === "holiday" || exception.type === "unavailable")) {
    return [];
  }

  const dayOfWeek = parse(date, "yyyy-MM-dd", new Date()).getDay();
  let ranges = availability.weekly.find((d) => d.dayOfWeek === dayOfWeek)?.ranges ?? [];
  let breaks =
    availability.weekly.find((d) => d.dayOfWeek === dayOfWeek)?.breaks ?? [];
  const dayAvailable =
    availability.weekly.find((d) => d.dayOfWeek === dayOfWeek)?.isAvailable ?? false;

  if (exception?.type === "special" && exception.ranges?.length) {
    ranges = exception.ranges;
    breaks = [];
  } else if (!dayAvailable && exception?.type !== "special") {
    return [];
  } else if (exception?.type === "blocked") {
    // keep weekly ranges but apply blocked slots / empty ranges mean full day block if no ranges
    if (!exception.ranges?.length && !exception.blockedSlots?.length) {
      return [];
    }
    if (exception.ranges?.length) {
      ranges = exception.ranges;
    }
  }

  const blockedSet = new Set(exception?.blockedSlots ?? []);
  const bookedIntervals = booked.map((b) => ({
    start: toMinutes(b.startTime),
    end: toMinutes(b.endTime) + bufferMinutes,
  }));

  const slots: string[] = [];

  for (const range of ranges) {
    let cursor = toMinutes(range.start);
    const end = toMinutes(range.end);

    while (cursor + durationMinutes <= end) {
      const slotStart = cursor;
      const slotEnd = cursor + durationMinutes;
      const startLabel = fromMinutes(slotStart);

      const inBreak = breaks.some((br) =>
        overlaps(slotStart, slotEnd, toMinutes(br.start), toMinutes(br.end)),
      );
      const conflicts = bookedIntervals.some((b) =>
        overlaps(slotStart, slotEnd + bufferMinutes, b.start, b.end),
      );
      const blocked = blockedSet.has(startLabel);

      if (!inBreak && !conflicts && !blocked) {
        slots.push(startLabel);
      }

      cursor += durationMinutes;
      if (bufferMinutes > 0) cursor += 0; // duration already steps; buffer applied in conflict check
    }
  }

  if (booked.length >= maxDailyAppointments) return [];
  const remaining = Math.max(0, maxDailyAppointments - booked.length);
  return slots.slice(0, remaining);
}

export function addDuration(startTime: string, durationMinutes: number) {
  const base = parse(startTime, "HH:mm", new Date());
  return format(addMinutes(base, durationMinutes), "HH:mm");
}

export function isPastSlot(date: string, startTime: string, now = new Date()) {
  const slot = parse(`${date} ${startTime}`, "yyyy-MM-dd HH:mm", new Date());
  return slot.getTime() <= now.getTime();
}
