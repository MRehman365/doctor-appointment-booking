import { connectDB } from "@/lib/db";
import { withTransaction } from "@/lib/db-transaction";
import { Appointment } from "@/lib/models/Appointment";
import { Doctor } from "@/lib/models/Doctor";
import { Service } from "@/lib/models/Service";
import { Payment } from "@/lib/models/Payment";
import { createLemonCheckout } from "@/lib/payments/lemonsqueezy";
import { generatePaymentReference } from "@/lib/services/ids";
import { getAvailableSlots } from "@/lib/services/slots";
import { addDuration } from "@/lib/slots/generate";
import { AppError } from "@/lib/utils/errors";
import type { z } from "zod";
import type { createBookingSchema } from "@/lib/validators/booking";

type CreateBookingInput = z.infer<typeof createBookingSchema>;

export async function createPendingBooking(input: CreateBookingInput) {
  await connectDB();

  const doctor = await Doctor.findOne({ _id: input.doctorId, isActive: true });
  if (!doctor) throw new AppError("Doctor not found", 404);

  const service = await Service.findOne({
    _id: input.serviceId,
    doctor: input.doctorId,
    isActive: true,
  });
  if (!service) throw new AppError("Service not found", 404);

  const { slots } = await getAvailableSlots(input.doctorId, input.serviceId, input.date);
  if (!slots.includes(input.startTime)) {
    throw new AppError("Selected time slot is no longer available", 409, "SLOT_UNAVAILABLE");
  }

  const reservationMinutes = Number(process.env.SLOT_RESERVATION_MINUTES || 15);
  const endTime = addDuration(input.startTime, service.durationMinutes);
  const paymentReference = await generatePaymentReference();

  try {
    const result = await withTransaction(async (session) => {
      const appointment = new Appointment({
        doctor: doctor._id,
        service: service._id,
        patientDetails: {
          ...input.patient,
          email: input.patient.email.toLowerCase(),
          dateOfBirth: input.patient.dateOfBirth
            ? new Date(input.patient.dateOfBirth)
            : undefined,
        },
        date: input.date,
        startTime: input.startTime,
        endTime,
        durationMinutes: service.durationMinutes,
        fee: service.price,
        currency: service.currency || "PKR",
        status: "pending_payment",
        reservationExpiresAt: new Date(Date.now() + reservationMinutes * 60 * 1000),
        statusHistory: [{ status: "pending_payment", at: new Date(), note: "Slot reserved" }],
      });

      await appointment.save({ session: session ?? undefined });

      const checkout = await createLemonCheckout({
        reference: paymentReference,
        appointmentId: String(appointment._id),
        email: input.patient.email,
        name: input.patient.fullName,
        amount: service.price,
        currency: service.currency || "PKR",
      });

      const payment = new Payment({
        appointment: appointment._id,
        reference: paymentReference,
        amount: service.price,
        currency: service.currency || "PKR",
        status: "pending",
        provider: checkout.provider,
        providerCheckoutId: checkout.checkoutId,
        checkoutUrl: checkout.checkoutUrl,
      });
      await payment.save({ session: session ?? undefined });

      appointment.payment = payment._id;
      await appointment.save({ session: session ?? undefined });

      return {
        appointmentId: String(appointment._id),
        paymentReference,
        checkoutUrl: checkout.checkoutUrl,
        reservationExpiresAt: appointment.reservationExpiresAt,
        summary: {
          doctor: doctor.fullName,
          specialization: doctor.specialization,
          service: service.name,
          date: input.date,
          startTime: input.startTime,
          endTime,
          durationMinutes: service.durationMinutes,
          fee: service.price,
          currency: service.currency || "PKR",
          patient: input.patient,
        },
      };
    });

    return result;
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new AppError("This slot was just booked by another patient", 409, "SLOT_TAKEN");
    }
    throw error;
  }
}
