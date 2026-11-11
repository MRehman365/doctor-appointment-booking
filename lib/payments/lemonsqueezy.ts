import crypto from "crypto";
import { AppError } from "@/lib/utils/errors";

const API_BASE = "https://api.lemonsqueezy.com/v1";

export function isMockPaymentMode() {
  const mode = process.env.PAYMENT_MODE ?? "mock";
  if (mode === "live") return false;
  if (process.env.NODE_ENV === "production" && mode === "mock") {
    throw new AppError(
      "PAYMENT_MODE=mock is not allowed in production",
      500,
      "PAYMENT_CONFIG",
    );
  }
  return mode !== "live";
}

export function lemonConfigured() {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_VARIANT_ID,
  );
}

export async function createLemonCheckout(input: {
  reference: string;
  appointmentId: string;
  email: string;
  name: string;
  amount: number;
  currency?: string;
}) {
  if (isMockPaymentMode() || !lemonConfigured()) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      checkoutId: `mock_${input.reference}`,
      checkoutUrl: `${appUrl}/api/payments/mock-complete?reference=${encodeURIComponent(input.reference)}`,
      provider: "mock" as const,
    };
  }

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email,
            name: input.name,
            custom: {
              appointment_id: input.appointmentId,
              payment_reference: input.reference,
            },
          },
          product_options: {
            name: "Clinic Consultation",
            description: `Appointment payment ${input.reference}`,
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/book/success?reference=${input.reference}`,
          },
          checkout_options: {
            embed: false,
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: String(process.env.LEMONSQUEEZY_STORE_ID),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: String(process.env.LEMONSQUEEZY_VARIANT_ID),
            },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Lemon Squeezy checkout error", text);
    throw new AppError("Unable to create payment checkout", 502, "PAYMENT_GATEWAY");
  }

  const json = await res.json();
  return {
    checkoutId: json.data.id as string,
    checkoutUrl: json.data.attributes.url as string,
    provider: "lemonsqueezy" as const,
  };
}

export function verifyLemonWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) throw new AppError("Webhook secret missing", 500, "PAYMENT_CONFIG");
  if (!signature) throw new AppError("Missing signature", 401, "INVALID_SIGNATURE");

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const check = Buffer.from(signature, "utf8");
  if (digest.length !== check.length || !crypto.timingSafeEqual(digest, check)) {
    throw new AppError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
  }
}
