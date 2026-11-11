import { Schema, models, model, type InferSchemaType, Types } from "mongoose";

const ClinicSettingsSchema = new Schema(
  {
    key: { type: String, default: "default", unique: true },
    clinicName: { type: String, default: "Medical Complex" },
    logo: { type: String, default: "/logo.png" },
    tagline: { type: String, default: "Trusted care, booked in minutes" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    mapEmbedUrl: { type: String, default: "" },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "PKR" },
    hero: {
      heading: { type: String, default: "Book your doctor appointment online" },
      description: {
        type: String,
        default:
          "Choose a specialist, pick a time that works for you, pay securely, and receive your appointment receipt instantly — no account required.",
      },
      image: { type: String, default: "" },
      ctaLabel: { type: String, default: "Book Appointment" },
      ctaHref: { type: String, default: "/book" },
    },
    about: {
      title: { type: String, default: "About our clinic" },
      body: {
        type: String,
        default:
          "We combine experienced clinicians with a modern booking experience so patients spend less time waiting and more time getting care.",
      },
      image: { type: String, default: "" },
    },
    whyChooseUs: [
      {
        title: String,
        description: String,
        icon: String,
      },
    ],
    testimonials: [
      {
        name: String,
        quote: String,
        role: String,
        rating: { type: Number, default: 5 },
      },
    ],
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    social: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
    },
    cancellationPolicy: { type: String, default: "" },
    refundPolicy: { type: String, default: "" },
  },
  { timestamps: true },
);

export type ClinicSettingsDocument = InferSchemaType<typeof ClinicSettingsSchema> & {
  _id: Types.ObjectId;
};

export const ClinicSettings =
  models.ClinicSettings || model("ClinicSettings", ClinicSettingsSchema);
