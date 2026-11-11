import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { Patient } from "@/lib/models/Patient";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["admin", "receptionist"]);
    await connectDB();

    const body = z
      .object({
        query: z.string().optional(),
        appointmentId: z.string().optional(),
        verificationToken: z.string().optional(),
        receiptToken: z.string().optional(),
      })
      .parse(await request.json());

    let appointment = null;

    if (body.appointmentId) {
      appointment = await Appointment.findById(body.appointmentId);
    } else if (body.verificationToken) {
      appointment = await Appointment.findOne({ verificationToken: body.verificationToken });
    } else if (body.receiptToken) {
      appointment = await Appointment.findOne({ receiptToken: body.receiptToken });
    } else if (body.query) {
      const q = body.query.trim();
      const patient = await Patient.findOne({
        $or: [{ patientId: q.toUpperCase() }, { phone: q }, { email: q.toLowerCase() }],
      });

      appointment = await Appointment.findOne({
        $or: [
          { appointmentNumber: q.toUpperCase() },
          { receiptToken: q },
          { verificationToken: q },
          ...(patient ? [{ patient: patient._id }] : []),
          { "patientDetails.phone": q },
          ...(Number.isFinite(Number(q)) ? [{ queueNumber: Number(q), date: today() }] : []),
        ],
        status: { $in: ["confirmed", "checked_in", "in_consultation"] },
      }).sort({ date: -1, startTime: 1 });
    }

    if (!appointment) throw new AppError("Appointment not found", 404);
    if (appointment.status === "pending_payment") {
      throw new AppError("Payment not completed", 402);
    }
    if (["cancelled", "expired", "no_show"].includes(appointment.status)) {
      throw new AppError(`Cannot check in a ${appointment.status} appointment`, 409);
    }

    if (appointment.status === "confirmed") {
      appointment.status = "checked_in";
      appointment.checkedInAt = new Date();
      appointment.statusHistory.push({
        status: "checked_in",
        at: new Date(),
        by: session.userId as any,
        note: "Reception check-in",
      });
      await appointment.save();
    }

    const populated = await Appointment.findById(appointment._id)
      .populate("doctor", "fullName specialization")
      .populate("service", "name")
      .populate("patient")
      .populate("payment", "status reference amount");

    return ok(populated);
  } catch (error) {
    return handleApiError(error);
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
