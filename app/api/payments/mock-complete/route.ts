import { connectDB } from "@/lib/db";
import { confirmAppointmentPayment } from "@/lib/services/confirm-appointment";
import { isMockPaymentMode } from "@/lib/payments/lemonsqueezy";
import { handleApiError, AppError } from "@/lib/utils/errors";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    if (!isMockPaymentMode()) {
      throw new AppError("Mock payments are disabled", 403);
    }
    await connectDB();
    const reference = new URL(request.url).searchParams.get("reference");
    if (!reference) throw new AppError("reference is required");

    const result = await confirmAppointmentPayment({
      paymentReference: reference,
      providerOrderId: `mock-order-${reference}`,
      providerTransactionId: `mock-tx-${Date.now()}`,
      method: "mock",
      rawWebhook: { mock: true },
    });

    const token = result.appointment?.receiptToken;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/book/success?reference=${reference}&token=${token}`);
  } catch (error) {
    return handleApiError(error);
  }
}
