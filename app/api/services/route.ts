import { connectDB } from "@/lib/db";
import { Service } from "@/lib/models/Service";
import { Doctor } from "@/lib/models/Doctor";
import { requireAuth, requireDoctorOwn } from "@/lib/auth/guards";
import { serviceSchema } from "@/lib/validators/booking";
import { slugify } from "@/lib/utils/slug";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const website = searchParams.get("website") === "1";

    const filter: Record<string, unknown> = { isActive: true };
    if (doctorId) filter.doctor = doctorId;
    if (website) filter.showOnWebsite = true;

    const services = await Service.find(filter)
      .populate("doctor", "fullName slug specialization profileImage")
      .sort({ createdAt: -1 });
    return ok(services);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = z
      .object({ doctorId: z.string() })
      .merge(serviceSchema)
      .parse(await request.json());

    await requireDoctorOwn(body.doctorId);
    const doctor = await Doctor.findById(body.doctorId);
    if (!doctor) throw new AppError("Doctor not found", 404);

    const service = await Service.create({
      doctor: doctor._id,
      name: body.name,
      slug: slugify(body.name),
      description: body.description || "",
      image: body.image || "",
      price: body.price,
      durationMinutes: body.durationMinutes,
      isActive: body.isActive ?? true,
      showOnWebsite: body.showOnWebsite ?? true,
    });

    if (!doctor.consultationFeeFrom || body.price < doctor.consultationFeeFrom) {
      doctor.consultationFeeFrom = body.price;
      await doctor.save();
    }

    return ok(service, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
