import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validators/booking";
import { AppError, handleApiError, ok } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const limited = rateLimit(`login:${ip}`, 10, 60_000);
    if (!limited.ok) throw new AppError("Too many login attempts", 429, "RATE_LIMIT");

    const body = loginSchema.parse(await request.json());
    await connectDB();

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user || !user.isActive) throw new AppError("Invalid credentials", 401);

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    user.lastLoginAt = new Date();
    await user.save();

    await setSessionCookie({
      userId: String(user._id),
      role: user.role,
      doctorId: user.doctorProfile ? String(user.doctorProfile) : undefined,
      name: user.name,
      email: user.email,
    });

    return ok({
      role: user.role,
      name: user.name,
      email: user.email,
      doctorId: user.doctorProfile ? String(user.doctorProfile) : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
