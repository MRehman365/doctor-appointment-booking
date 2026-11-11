import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Doctor } from "@/lib/models/Doctor";
import { Service } from "@/lib/models/Service";
import { requireAuth, requireDoctorOwn } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }], isActive: true }
      : { slug: id, isActive: true };

    const doctor = await Doctor.findOne(filter);
    if (!doctor) throw new AppError("Doctor not found", 404);

    const services = await Service.find({ doctor: doctor._id, isActive: true });
    return ok({ doctor, services });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const doctor = await Doctor.findById(id);
    if (!doctor) throw new AppError("Doctor not found", 404);
    await requireDoctorOwn(String(doctor._id));

    const body = await request.json();
    const allowed = [
      "fullName",
      "title",
      "specialization",
      "qualifications",
      "experienceYears",
      "biography",
      "shortDescription",
      "languages",
      "profileImage",
      "clinicLocation",
      "contactEmail",
      "contactPhone",
      "consultationFeeFrom",
      "bufferMinutes",
      "maxDailyAppointments",
      "defaultSlotDuration",
      "isActive",
      "isFeatured",
      "sortOrder",
    ] as const;

    const session = await requireAuth(["doctor", "admin"]);
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (["isActive", "isFeatured", "sortOrder"].includes(key) && session.role !== "admin") {
          continue;
        }
        (doctor as any)[key] = body[key];
      }
    }
    await doctor.save();
    return ok(doctor);
  } catch (error) {
    return handleApiError(error);
  }
}
