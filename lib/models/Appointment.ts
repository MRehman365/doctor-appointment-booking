import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

export const APPOINTMENT_STATUSES = [
  "pending_payment",
  "confirmed",
  "checked_in",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
  "expired",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const AppointmentSchema = new Schema(
  {
    appointmentNumber: { type: String, unique: true, sparse: true },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },

    // Snapshot patient details at booking time (before patient record exists)
    patientDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      age: { type: Number },
      dateOfBirth: { type: Date },
      gender: { type: String, default: "unspecified" },
      reason: { type: String, default: "" },
      notes: { type: String, default: "" },
    },

    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    fee: { type: Number, required: true },
    currency: { type: String, default: "PKR" },

    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: "pending_payment",
      index: true,
    },
    queueNumber: { type: Number },
    queueOrder: { type: Number },

    reservationExpiresAt: { type: Date },
    confirmedAt: { type: Date },
    checkedInAt: { type: Date },
    consultationStartedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },

    receiptToken: { type: String, unique: true, sparse: true },
    verificationToken: { type: String, unique: true, sparse: true },

    medicalNotes: { type: String, default: "", select: false },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
  },
  { timestamps: true },
);

// Prevent double booking for active reservations / confirmed appointments
AppointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          "pending_payment",
          "confirmed",
          "checked_in",
          "in_consultation",
          "completed",
        ],
      },
    },
  },
);

AppointmentSchema.index({ doctor: 1, date: 1, queueNumber: 1 });
AppointmentSchema.index({ "patientDetails.email": 1 });
AppointmentSchema.index({ "patientDetails.phone": 1 });

export type AppointmentDocument = InferSchemaType<typeof AppointmentSchema> & {
  _id: Types.ObjectId;
};

export const Appointment =
  models.Appointment || model("Appointment", AppointmentSchema);
