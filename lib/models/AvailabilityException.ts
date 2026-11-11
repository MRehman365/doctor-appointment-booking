import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const TimeRangeSchema = new Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false },
);

const AvailabilityExceptionSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: {
      type: String,
      enum: ["holiday", "blocked", "special", "unavailable"],
      required: true,
    },
    ranges: { type: [TimeRangeSchema], default: [] },
    blockedSlots: [{ type: String }], // HH:mm
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

AvailabilityExceptionSchema.index({ doctor: 1, date: 1 }, { unique: true });

export type AvailabilityExceptionDocument = InferSchemaType<
  typeof AvailabilityExceptionSchema
> & { _id: Types.ObjectId };

export const AvailabilityException =
  models.AvailabilityException ||
  model("AvailabilityException", AvailabilityExceptionSchema);
