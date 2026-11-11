import { connectDB } from "@/lib/db";
import { Patient } from "@/lib/models/Patient";
import { Appointment } from "@/lib/models/Appointment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    await requireAuth(["admin", "doctor", "receptionist"]);
    await connectDB();
    const q = new URL(request.url).searchParams.get("q");

    const filter = q
      ? {
          $or: [
            { patientId: new RegExp(q, "i") },
            { fullName: new RegExp(q, "i") },
            { phone: new RegExp(q, "i") },
            { email: new RegExp(q, "i") },
          ],
        }
      : {};

    const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(100);
    return ok(patients);
  } catch (error) {
    return handleApiError(error);
  }
}
