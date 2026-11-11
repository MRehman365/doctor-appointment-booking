import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const TimeRangeSchema = new Schema(
  {
    start: { type: String, required: true }, // HH:mm
    end: { type: String, required: true },
  },
  { _id: false },
);

const DayScheduleSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sunday
    isAvailable: { type: Boolean, default: true },
    ranges: { type: [TimeRangeSchema], default: [] },
    breaks: { type: [TimeRangeSchema], default: [] },
  },
  { _id: false },
);

const DoctorAvailabilitySchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
    timezone: { type: String, default: "Asia/Karachi" },
    weekly: { type: [DayScheduleSchema], default: [] },
    bufferMinutes: { type: Number, default: 0 },
    maxDailyAppointments: { type: Number, default: 40 },
  },
  { timestamps: true },
);

export type DoctorAvailabilityDocument = InferSchemaType<typeof DoctorAvailabilitySchema> & {
  _id: Types.ObjectId;
};

export const DoctorAvailability =
  models.DoctorAvailability || model("DoctorAvailability", DoctorAvailabilitySchema);
