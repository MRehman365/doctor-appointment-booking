import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Patient } from "@/lib/models/Patient";
import { Appointment } from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAuth(["admin", "doctor", "receptionist"]);
    await connectDB();
    const { id } = await params;

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { patientId: id.toUpperCase() }] }
      : { patientId: id.toUpperCase() };

    const patient = await Patient.findOne(filter);
    if (!patient) throw new AppError("Patient not found", 404);

    const appointments = await Appointment.find({ patient: patient._id })
      .populate("doctor", "fullName specialization")
      .populate("service", "name")
      .populate("payment", "status amount reference")
      .sort({ date: -1 });

    return ok({ patient, appointments });
  } catch (error) {
    return handleApiError(error);
  }
}
