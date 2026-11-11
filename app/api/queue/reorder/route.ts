import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { AuditLog } from "@/lib/models/AuditLog";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["admin", "receptionist"]);
    await connectDB();

    const body = z
      .object({
        doctorId: z.string(),
        date: z.string(),
        orderedAppointmentIds: z.array(z.string()).min(1),
      })
      .parse(await request.json());

    const appointments = await Appointment.find({
      doctor: body.doctorId,
      date: body.date,
      _id: { $in: body.orderedAppointmentIds },
    });

    if (appointments.length !== body.orderedAppointmentIds.length) {
      throw new AppError("Some appointments were not found for this doctor/date", 400);
    }

    const updates = body.orderedAppointmentIds.map((id, index) =>
      Appointment.updateOne({ _id: id }, { $set: { queueOrder: index + 1 } }),
    );
    await Promise.all(updates);

    await AuditLog.create({
      actor: session.userId,
      action: "queue.reorder",
      entityType: "Queue",
      entityId: `${body.doctorId}:${body.date}`,
      meta: { orderedAppointmentIds: body.orderedAppointmentIds },
    });

    return ok({ reordered: true });
  } catch (error) {
    return handleApiError(error);
  }
}
