import { connectDB } from "@/lib/db";
import { DoctorAvailability } from "@/lib/models/DoctorAvailability";
import { AvailabilityException } from "@/lib/models/AvailabilityException";
import { requireDoctorOwn } from "@/lib/auth/guards";
import { weeklyAvailabilitySchema } from "@/lib/validators/booking";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    await connectDB();
    const doctorId = new URL(request.url).searchParams.get("doctorId");
    if (!doctorId) throw new AppError("doctorId is required");

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
    const exceptions = await AvailabilityException.find({ doctor: doctorId }).sort({
      date: 1,
    });
    return ok({ availability, exceptions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = z
      .object({ doctorId: z.string() })
      .merge(weeklyAvailabilitySchema)
      .parse(await request.json());
    await requireDoctorOwn(body.doctorId);

    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctor: body.doctorId },
      {
        doctor: body.doctorId,
        timezone: body.timezone || "Asia/Karachi",
        weekly: body.weekly,
        bufferMinutes: body.bufferMinutes ?? 0,
        maxDailyAppointments: body.maxDailyAppointments ?? 40,
      },
      { upsert: true, returnDocument: "after" },
    );
    return ok(availability);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = z
      .object({
        doctorId: z.string(),
        date: z.string(),
        type: z.enum(["holiday", "blocked", "special", "unavailable"]),
        ranges: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
        blockedSlots: z.array(z.string()).optional(),
        reason: z.string().optional(),
      })
      .parse(await request.json());
    await requireDoctorOwn(body.doctorId);

    const exception = await AvailabilityException.findOneAndUpdate(
      { doctor: body.doctorId, date: body.date },
      {
        doctor: body.doctorId,
        date: body.date,
        type: body.type,
        ranges: body.ranges || [],
        blockedSlots: body.blockedSlots || [],
        reason: body.reason || "",
      },
      { upsert: true, returnDocument: "after" },
    );
    return ok(exception, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    if (!doctorId || !date) throw new AppError("doctorId and date are required");
    await requireDoctorOwn(doctorId);
    await AvailabilityException.deleteOne({ doctor: doctorId, date });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
