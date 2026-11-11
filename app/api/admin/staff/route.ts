import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAuth } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { z } from "zod";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const staff = await User.find({ role: { $in: ["admin", "receptionist", "doctor"] } })
      .select("-passwordHash")
      .populate("doctorProfile", "fullName specialization")
      .sort({ createdAt: -1 });
    return ok(staff);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["admin", "receptionist"]),
        phone: z.string().optional(),
      })
      .parse(await request.json());

    const exists = await User.findOne({ email: body.email.toLowerCase() });
    if (exists) throw new AppError("Email already exists", 409);

    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: body.role,
      phone: body.phone,
    });

    return ok(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const body = z
      .object({
        userId: z.string(),
        isActive: z.boolean().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        password: z.string().min(8).optional(),
      })
      .parse(await request.json());

    const user = await User.findById(body.userId);
    if (!user) throw new AppError("User not found", 404);
    if (body.isActive !== undefined) user.isActive = body.isActive;
    if (body.name) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.password) user.passwordHash = await hashPassword(body.password);
    await user.save();
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
