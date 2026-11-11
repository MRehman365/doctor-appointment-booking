import { connectDB } from "@/lib/db";
import { Payment } from "@/lib/models/Payment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { reference: new RegExp(q, "i") },
        { providerOrderId: new RegExp(q, "i") },
        { providerTransactionId: new RegExp(q, "i") },
      ];
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "appointment",
        select: "appointmentNumber date startTime patientDetails doctor fee",
        populate: { path: "doctor", select: "fullName" },
      })
      .sort({ createdAt: -1 })
      .limit(200);

    return ok(payments);
  } catch (error) {
    return handleApiError(error);
  }
}
