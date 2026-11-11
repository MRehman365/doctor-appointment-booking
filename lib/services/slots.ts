import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { DoctorAvailability } from "@/lib/models/DoctorAvailability";
import { AvailabilityException } from "@/lib/models/AvailabilityException";
import { Service } from "@/lib/models/Service";
import { generateSlotsForDate, isPastSlot } from "@/lib/slots/generate";
import { releaseExpiredReservations } from "@/lib/services/confirm-appointment";
import { AppError } from "@/lib/utils/errors";

export async function getAvailableSlots(doctorId: string, serviceId: string, date: string) {
  await connectDB();
  await releaseExpiredReservations();

  const service = await Service.findOne({ _id: serviceId, doctor: doctorId, isActive: true });
  if (!service) throw new AppError("Service not found", 404);

  const availability = await DoctorAvailability.findOne({ doctor: doctorId });
  const exception = await AvailabilityException.findOne({ doctor: doctorId, date });

  const booked = await Appointment.find({
    doctor: doctorId,
    date,
    status: {
      $in: [
        "pending_payment",
        "confirmed",
        "checked_in",
        "in_consultation",
        "completed",
      ],
    },
  }).select("startTime endTime");

  const slots = generateSlotsForDate({
    date,
    durationMinutes: service.durationMinutes,
    availability,
    exception,
    booked: booked.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    bufferMinutes: availability?.bufferMinutes,
    maxDailyAppointments: availability?.maxDailyAppointments,
  }).filter((slot) => !isPastSlot(date, slot));

  return {
    date,
    durationMinutes: service.durationMinutes,
    slots,
    fullyBooked: slots.length === 0,
  };
}

export async function getAvailabilityCalendar(
  doctorId: string,
  serviceId: string,
  from: string,
  to: string,
) {
  await connectDB();
  const service = await Service.findOne({ _id: serviceId, doctor: doctorId, isActive: true });
  if (!service) throw new AppError("Service not found", 404);

  const availability = await DoctorAvailability.findOne({ doctor: doctorId });
  const exceptions = await AvailabilityException.find({
    doctor: doctorId,
    date: { $gte: from, $lte: to },
  });
  const exceptionMap = new Map(exceptions.map((e) => [e.date, e]));

  const appointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: from, $lte: to },
    status: {
      $in: [
        "pending_payment",
        "confirmed",
        "checked_in",
        "in_consultation",
        "completed",
      ],
    },
  }).select("date startTime endTime");

  const byDate = new Map<string, { startTime: string; endTime: string }[]>();
  for (const a of appointments) {
    const list = byDate.get(a.date) || [];
    list.push({ startTime: a.startTime, endTime: a.endTime });
    byDate.set(a.date, list);
  }

  const days: Record<string, "available" | "unavailable" | "full" | "past"> = {};

  // Walk the range with plain date strings (UTC math) so results never shift with server timezone.
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const startMs = Date.UTC(fy, fm - 1, fd);
  const endMs = Date.UTC(ty, tm - 1, td);
  const now = new Date();
  const todayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  for (let ms = startMs; ms <= endMs; ms += 24 * 60 * 60 * 1000) {
    const cursor = new Date(ms);
    const key = cursor.toISOString().slice(0, 10);

    if (key < todayKey) {
      days[key] = "past";
      continue;
    }

    const exception = exceptionMap.get(key);
    const slots = generateSlotsForDate({
      date: key,
      durationMinutes: service.durationMinutes,
      availability,
      exception,
      booked: byDate.get(key) || [],
      bufferMinutes: availability?.bufferMinutes,
      maxDailyAppointments: availability?.maxDailyAppointments,
    }).filter((slot) => !isPastSlot(key, slot));

    if (slots.length) {
      days[key] = "available";
      continue;
    }

    const dayOfWeek = cursor.getUTCDay();
    const weekly = availability?.weekly.find(
      (w: { dayOfWeek: number; isAvailable: boolean }) => w.dayOfWeek === dayOfWeek,
    );

    if (exception?.type === "special") days[key] = "full";
    else if (!weekly?.isAvailable) days[key] = "unavailable";
    else if (exception?.type === "holiday" || exception?.type === "unavailable") {
      days[key] = "unavailable";
    } else days[key] = "full";
  }
  return days;
}
