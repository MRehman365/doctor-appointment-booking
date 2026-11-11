import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { ClinicSettings } from "@/lib/models/ClinicSettings";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    const appointment = await Appointment.findOne({ receiptToken: token })
      .populate("doctor", "fullName specialization title")
      .populate("service", "name durationMinutes")
      .populate("patient", "patientId fullName phone email age")
      .populate("payment", "status reference amount method paidAt providerTransactionId");

    if (!appointment) throw new AppError("Receipt not found", 404);
    if (!["confirmed", "checked_in", "in_consultation", "completed"].includes(appointment.status)) {
      throw new AppError("Receipt available only for confirmed appointments", 409);
    }

    const clinic = await ClinicSettings.findOne({ key: "default" });
    return ok({ appointment, clinic });
  } catch (error) {
    return handleApiError(error);
  }
}
