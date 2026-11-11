import { createPendingBooking } from "@/lib/services/booking";
import { createBookingSchema } from "@/lib/validators/booking";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const limited = rateLimit(`book:${ip}`, 20, 60_000);
    if (!limited.ok) throw new AppError("Too many booking attempts", 429);

    const body = createBookingSchema.parse(await request.json());
    const result = await createPendingBooking(body);
    return ok(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
