import { connectDB } from "@/lib/db";
import { confirmAppointmentPayment } from "@/lib/services/confirm-appointment";
import { verifyLemonWebhookSignature } from "@/lib/payments/lemonsqueezy";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");
    verifyLemonWebhookSignature(rawBody, signature);

    await connectDB();
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name as string | undefined;
    const custom = payload.meta?.custom_data || {};
    const reference =
      custom.payment_reference ||
      payload.data?.attributes?.first_order_item?.custom?.payment_reference;

    if (!reference) throw new AppError("Missing payment reference in webhook", 400);

    if (
      eventName === "order_created" ||
      eventName === "subscription_payment_success" ||
      payload.data?.attributes?.status === "paid"
    ) {
      const result = await confirmAppointmentPayment({
        paymentReference: reference,
        providerOrderId: String(payload.data?.id || ""),
        providerTransactionId: String(payload.data?.attributes?.identifier || ""),
        rawWebhook: payload,
        method: "lemonsqueezy",
      });
      return ok({
        confirmed: true,
        alreadyConfirmed: result.alreadyConfirmed,
        appointmentId: result.appointment?._id,
      });
    }

    return ok({ ignored: true, eventName });
  } catch (error) {
    return handleApiError(error);
  }
}
