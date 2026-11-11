import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const DoctorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    title: { type: String, default: "Consultant" },
    specialization: { type: String, required: true },
    qualifications: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    biography: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    languages: [{ type: String }],
    profileImage: { type: String, default: "" },
    clinicLocation: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    consultationFeeFrom: { type: Number, default: 0 },
    bufferMinutes: { type: Number, default: 0 },
    maxDailyAppointments: { type: Number, default: 40 },
    defaultSlotDuration: { type: Number, default: 15 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

DoctorSchema.index({ isActive: 1, specialization: 1 });
DoctorSchema.index({ fullName: "text", specialization: "text" });

export type DoctorDocument = InferSchemaType<typeof DoctorSchema> & {
  _id: Types.ObjectId;
};

export const Doctor = models.Doctor || model("Doctor", DoctorSchema);
