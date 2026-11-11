import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";
import { Appointment } from "@/lib/models/Appointment";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    await connectDB();
    const reference = new URL(request.url).searchParams.get("reference");
    if (!reference) throw new AppError("reference is required");

    const payment = await Payment.findOne({ reference });
    if (!payment) throw new AppError("Payment not found", 404);

    const appointment = await Appointment.findById(payment.appointment)
      .populate("doctor")
      .populate("service")
      .populate("patient")
      .populate("payment");

    return ok({
      paymentStatus: payment.status,
      appointmentStatus: appointment?.status,
      appointment,
      receiptToken: appointment?.receiptToken,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
