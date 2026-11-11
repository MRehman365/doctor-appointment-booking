import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    await requireAuth(["admin", "receptionist", "doctor"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const doctorId = searchParams.get("doctorId");

    const filter: Record<string, unknown> = {
      date,
      status: {
        $in: [
          "confirmed",
          "checked_in",
          "in_consultation",
          "completed",
          "no_show",
          "pending_payment",
        ],
      },
    };
    if (doctorId) filter.doctor = doctorId;

    const appointments = await Appointment.find(filter)
      .populate("doctor", "fullName specialization")
      .populate("service", "name durationMinutes")
      .populate("patient", "patientId fullName phone")
      .populate("payment", "status")
      .sort({ queueOrder: 1, startTime: 1 });

    const stats = {
      totalConfirmed: appointments.filter((a) =>
        ["confirmed", "checked_in", "in_consultation", "completed"].includes(a.status),
      ).length,
      checkedIn: appointments.filter((a) => a.status === "checked_in").length,
      waiting: appointments.filter((a) => a.status === "checked_in").length,
      inConsultation: appointments.filter((a) => a.status === "in_consultation").length,
      completed: appointments.filter((a) => a.status === "completed").length,
    };

    return ok({ date, stats, appointments });
  } catch (error) {
    return handleApiError(error);
  }
}
