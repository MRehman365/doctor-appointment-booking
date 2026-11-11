import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { token } = await params;
    const appointment = await Appointment.findOne({ verificationToken: token })
      .populate("doctor", "fullName specialization")
      .populate("service", "name")
      .populate("patient", "patientId fullName")
      .populate("payment", "status");

    if (!appointment) throw new AppError("Invalid verification token", 404);

    return ok({
      valid: true,
      appointmentNumber: appointment.appointmentNumber,
      queueNumber: appointment.queueNumber,
      status: appointment.status,
      paymentStatus: (appointment.payment as any)?.status,
      date: appointment.date,
      startTime: appointment.startTime,
      doctor: (appointment.doctor as any)?.fullName,
      patientId: (appointment.patient as any)?.patientId,
      patientName: (appointment.patient as any)?.fullName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
