import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const PatientSchema = new Schema(
  {
    patientId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other", "unspecified"], default: "unspecified" },
    notes: { type: String, default: "" },
    registrationDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

PatientSchema.index({ email: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ fullName: "text" });

export type PatientDocument = InferSchemaType<typeof PatientSchema> & {
  _id: Types.ObjectId;
};

export const Patient = models.Patient || model("Patient", PatientSchema);
