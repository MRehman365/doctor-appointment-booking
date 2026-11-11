import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const ServiceSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 5 },
    currency: { type: String, default: "PKR" },
    isActive: { type: Boolean, default: true },
    showOnWebsite: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ServiceSchema.index({ doctor: 1, slug: 1 }, { unique: true });
ServiceSchema.index({ isActive: 1, showOnWebsite: 1 });

export type ServiceDocument = InferSchemaType<typeof ServiceSchema> & {
  _id: Types.ObjectId;
};

export const Service = models.Service || model("Service", ServiceSchema);
