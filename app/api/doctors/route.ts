import { connectDB } from "@/lib/db";
import { Doctor } from "@/lib/models/Doctor";
import { Service } from "@/lib/models/Service";
import { User } from "@/lib/models/User";
import { requireAuth } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/utils/slug";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";

    if (all) {
      await requireAuth(["admin"]);
      const doctors = await Doctor.find().sort({ sortOrder: 1, fullName: 1 });
      return ok(doctors);
    }

    const doctors = await Doctor.find({ isActive: true }).sort({
      isFeatured: -1,
      sortOrder: 1,
      fullName: 1,
    });
    return ok(doctors);
  } catch (error) {
    return handleApiError(error);
  }
}

const createDoctorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  title: z.string().optional(),
  specialization: z.string().min(2),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().optional(),
  biography: z.string().optional(),
  shortDescription: z.string().optional(),
  languages: z.array(z.string()).optional(),
  profileImage: z.string().optional(),
  clinicLocation: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  consultationFeeFrom: z.number().optional(),
  isFeatured: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const body = createDoctorSchema.parse(await request.json());

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) throw new AppError("Email already in use", 409);

    let slug = slugify(body.fullName);
    const slugExists = await Doctor.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const user = await User.create({
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: "doctor",
      name: body.fullName,
      phone: body.contactPhone,
    });

    const doctor = await Doctor.create({
      user: user._id,
      fullName: body.fullName,
      slug,
      title: body.title || "Consultant",
      specialization: body.specialization,
      qualifications: body.qualifications || [],
      experienceYears: body.experienceYears || 0,
      biography: body.biography || "",
      shortDescription: body.shortDescription || "",
      languages: body.languages || ["English"],
      profileImage: body.profileImage || "",
      clinicLocation: body.clinicLocation || "",
      contactEmail: body.contactEmail || body.email,
      contactPhone: body.contactPhone || "",
      consultationFeeFrom: body.consultationFeeFrom || 0,
      isFeatured: body.isFeatured ?? false,
    });

    user.doctorProfile = doctor._id;
    await user.save();

    // Ensure at least one sample is not required — empty services ok
    await Service.exists({ doctor: doctor._id });

    return ok(doctor, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
