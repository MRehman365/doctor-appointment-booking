import { connectDB } from "@/lib/db";
import { Appointment, APPOINTMENT_STATUSES } from "@/lib/models/Appointment";
import { AuditLog } from "@/lib/models/AuditLog";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth(["admin", "doctor", "receptionist"]);
    await connectDB();
    const { id } = await params;

    const body = z
      .object({
        status: z.enum(APPOINTMENT_STATUSES),
        note: z.string().optional(),
        medicalNotes: z.string().optional(),
      })
      .parse(await request.json());

    const appointment = await Appointment.findById(id);
    if (!appointment) throw new AppError("Appointment not found", 404);

    if (session.role === "doctor" && String(appointment.doctor) !== session.doctorId) {
      throw new AppError("Forbidden", 403);
    }

    appointment.status = body.status;
    appointment.statusHistory.push({
      status: body.status,
      at: new Date(),
      by: session.userId as any,
      note: body.note || "",
    });

    if (body.status === "checked_in") appointment.checkedInAt = new Date();
    if (body.status === "in_consultation") appointment.consultationStartedAt = new Date();
    if (body.status === "completed") appointment.completedAt = new Date();
    if (body.status === "cancelled") appointment.cancelledAt = new Date();

    if (body.medicalNotes !== undefined) {
      if (session.role === "doctor" || session.role === "admin") {
        appointment.medicalNotes = body.medicalNotes;
      }
    }

    await appointment.save();

    await AuditLog.create({
      actor: session.userId,
      action: `appointment.status.${body.status}`,
      entityType: "Appointment",
      entityId: String(appointment._id),
      meta: { note: body.note },
    });

    return ok(appointment);
  } catch (error) {
    return handleApiError(error);
  }
}
