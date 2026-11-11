import { nanoid } from "nanoid";
import { Appointment } from "@/lib/models/Appointment";
import { Patient } from "@/lib/models/Patient";
import { Payment } from "@/lib/models/Payment";
import {
  allocateQueueNumber,
  generateAppointmentNumber,
  generatePatientId,
} from "@/lib/services/ids";
import { sendAppointmentConfirmedNotifications } from "@/lib/notifications/send";
import { AppError } from "@/lib/utils/errors";
import { withTransaction } from "@/lib/db-transaction";

export async function confirmAppointmentPayment(options: {
  paymentReference: string;
  providerOrderId?: string;
  providerTransactionId?: string;
  rawWebhook?: unknown;
  method?: string;
}) {
  const result = await withTransaction(async (session) => {
    const payment = await Payment.findOne({ reference: options.paymentReference }).session(
      session,
    );
    if (!payment) throw new AppError("Payment not found", 404, "NOT_FOUND");

    if (payment.status === "paid") {
      const existing = await Appointment.findById(payment.appointment)
        .populate("doctor")
        .populate("service")
        .populate("patient")
        .populate("payment")
        .session(session);
      return { appointment: existing, alreadyConfirmed: true as const, skipNotify: true };
    }

    if (payment.status !== "pending") {
      throw new AppError("Payment is not pending", 409, "INVALID_PAYMENT_STATE");
    }

    const appointment = await Appointment.findById(payment.appointment).session(session);
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");

    if (
      appointment.status === "expired" ||
      (appointment.reservationExpiresAt &&
        appointment.reservationExpiresAt.getTime() < Date.now() &&
        appointment.status === "pending_payment")
    ) {
      payment.status = "expired";
      await payment.save({ session: session ?? undefined });
      appointment.status = "expired";
      await appointment.save({ session: session ?? undefined });
      throw new AppError("Reservation expired", 410, "RESERVATION_EXPIRED");
    }

    const details = appointment.patientDetails;
    let patient = await Patient.findOne({
      $or: [{ email: details.email.toLowerCase() }, { phone: details.phone }],
    }).session(session);

    if (!patient) {
      patient = new Patient({
        patientId: await generatePatientId(),
        fullName: details.fullName,
        email: details.email.toLowerCase(),
        phone: details.phone,
        age: details.age,
        dateOfBirth: details.dateOfBirth,
        gender: details.gender || "unspecified",
      });
      await patient.save({ session: session ?? undefined });
    }

    const appointmentNumber = await generateAppointmentNumber();
    const queueNumber = await allocateQueueNumber(appointment.doctor, appointment.date);
    const receiptToken = nanoid(24);
    const verificationToken = nanoid(24);

    payment.status = "paid";
    payment.paidAt = new Date();
    payment.providerOrderId = options.providerOrderId ?? payment.providerOrderId;
    payment.providerTransactionId =
      options.providerTransactionId ?? payment.providerTransactionId;
    payment.method = options.method ?? payment.method;
    payment.rawWebhook = options.rawWebhook;
    payment.idempotencyKey = payment.idempotencyKey ?? `paid:${payment.reference}`;
    await payment.save({ session: session ?? undefined });

    appointment.patient = patient._id;
    appointment.payment = payment._id;
    appointment.status = "confirmed";
    appointment.appointmentNumber = appointmentNumber;
    appointment.queueNumber = queueNumber;
    appointment.queueOrder = queueNumber;
    appointment.confirmedAt = new Date();
    appointment.receiptToken = receiptToken;
    appointment.verificationToken = verificationToken;
    appointment.reservationExpiresAt = undefined;
    appointment.statusHistory.push({
      status: "confirmed",
      at: new Date(),
      note: "Payment verified",
    });
    await appointment.save({ session: session ?? undefined });

    const populated = await Appointment.findById(appointment._id)
      .populate("doctor")
      .populate("service")
      .populate("patient")
      .populate("payment")
      .session(session);

    return { appointment: populated, alreadyConfirmed: false as const, skipNotify: false };
  });

  if (!result.skipNotify && result.appointment) {
    void sendAppointmentConfirmedNotifications(result.appointment);
  }

  return result;
}

export async function releaseExpiredReservations() {
  const now = new Date();
  const expired = await Appointment.find({
    status: "pending_payment",
    reservationExpiresAt: { $lte: now },
  }).select("_id");

  if (!expired.length) return 0;

  const ids = expired.map((a) => a._id);
  await Appointment.updateMany(
    { _id: { $in: ids } },
    {
      $set: { status: "expired" },
      $push: { statusHistory: { status: "expired", at: now, note: "Reservation timed out" } },
    },
  );
  await Payment.updateMany(
    { appointment: { $in: ids }, status: "pending" },
    { $set: { status: "expired" } },
  );
  return ids.length;
}
