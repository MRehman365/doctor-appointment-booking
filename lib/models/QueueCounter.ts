import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const QueueCounterSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    lastNumber: { type: Number, default: 0 },
  },
  { timestamps: true },
);

QueueCounterSchema.index({ doctor: 1, date: 1 }, { unique: true });

export type QueueCounterDocument = InferSchemaType<typeof QueueCounterSchema> & {
  _id: Types.ObjectId;
};

export const QueueCounter =
  models.QueueCounter || model("QueueCounter", QueueCounterSchema);
