import { getAvailabilityCalendar, getAvailableSlots } from "@/lib/services/slots";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const limited = rateLimit(`slots:${ip}`, 60, 60_000);
    if (!limited.ok) throw new AppError("Too many requests", 429);

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!doctorId || !serviceId) {
      throw new AppError("doctorId and serviceId are required");
    }

    if (from && to) {
      const days = await getAvailabilityCalendar(doctorId, serviceId, from, to);
      return ok({ from, to, days });
    }

    if (!date) throw new AppError("date or from/to is required");
    const result = await getAvailableSlots(doctorId, serviceId, date);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
