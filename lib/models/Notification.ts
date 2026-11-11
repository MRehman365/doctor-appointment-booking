import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const NotificationSchema = new Schema(
  {
    channel: { type: String, enum: ["email", "sms", "whatsapp", "in_app"], required: true },
    type: { type: String, required: true },
    recipient: { type: String, required: true },
    subject: { type: String },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "skipped"],
      default: "queued",
    },
    meta: { type: Schema.Types.Mixed },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true },
);

NotificationSchema.index({ createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & {
  _id: Types.ObjectId;
};

export const Notification =
  models.Notification || model("Notification", NotificationSchema);
