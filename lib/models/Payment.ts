import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "expired"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PaymentSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    reference: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "PKR" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "pending", index: true },
    provider: { type: String, default: "lemonsqueezy" },
    providerCheckoutId: { type: String },
    providerOrderId: { type: String },
    providerTransactionId: { type: String },
    checkoutUrl: { type: String },
    method: { type: String, default: "online" },
    paidAt: { type: Date },
    failedAt: { type: Date },
    refundedAt: { type: Date },
    rawWebhook: { type: Schema.Types.Mixed },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export type PaymentDocument = InferSchemaType<typeof PaymentSchema> & {
  _id: Types.ObjectId;
};

export const Payment = models.Payment || model("Payment", PaymentSchema);
