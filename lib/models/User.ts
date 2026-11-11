import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

export const USER_ROLES = ["admin", "doctor", "receptionist"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    doctorProfile: { type: Schema.Types.ObjectId, ref: "Doctor" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

UserSchema.index({ role: 1, isActive: 1 });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: Types.ObjectId;
};

export const User = models.User || model("User", UserSchema);
