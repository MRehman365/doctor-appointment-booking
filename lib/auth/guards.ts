import { AppError } from "@/lib/utils/errors";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { UserRole } from "@/lib/models/User";

export async function requireAuth(roles?: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  if (roles && !roles.includes(session.role)) {
    throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
  }
  return session;
}

export async function requireDoctorOwn(doctorId: string) {
  const session = await requireAuth(["doctor", "admin"]);
  if (session.role === "doctor" && session.doctorId !== doctorId) {
    throw new AppError("You can only manage your own resources", 403, "FORBIDDEN");
  }
  return session;
}
