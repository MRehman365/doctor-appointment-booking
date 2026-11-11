import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    const session = await requireAuth(["admin", "doctor", "receptionist"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};

    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (session.role === "doctor") {
      filter.doctor = session.doctorId;
    } else if (doctorId) {
      filter.doctor = doctorId;
    }

    if (date) filter.date = date;
    if (from && to) filter.date = { $gte: from, $lte: to };
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { appointmentNumber: new RegExp(q, "i") },
        { "patientDetails.fullName": new RegExp(q, "i") },
        { "patientDetails.phone": new RegExp(q, "i") },
        { "patientDetails.email": new RegExp(q, "i") },
      ];
    }

    const appointments = await Appointment.find(filter)
      .populate("doctor", "fullName specialization")
      .populate("service", "name durationMinutes price")
      .populate("patient", "patientId fullName")
      .populate("payment", "status reference amount")
      .sort({ date: 1, startTime: 1 })
      .limit(200);

    return ok(appointments);
  } catch (error) {
    return handleApiError(error);
  }
}
