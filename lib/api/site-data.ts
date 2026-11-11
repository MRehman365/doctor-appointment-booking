import "server-only";
import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor } from "@/lib/models/Doctor";
import { Service } from "@/lib/models/Service";
import { DoctorAvailability } from "@/lib/models/DoctorAvailability";
import { ClinicSettings } from "@/lib/models/ClinicSettings";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getHomeDoctors() {
  await connection();
  await connectDB();
  const doctors = await Doctor.find({ isActive: true })
    .sort({ isFeatured: -1, sortOrder: 1, fullName: 1 })
    .lean();
  return doctors.map((d) => ({
    _id: String(d._id),
    fullName: d.fullName,
    slug: d.slug,
    title: d.title,
    specialization: d.specialization,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears,
    biography: d.biography,
    shortDescription: d.shortDescription,
    languages: d.languages,
    profileImage: d.profileImage || "",
    clinicLocation: d.clinicLocation,
    consultationFeeFrom: d.consultationFeeFrom,
    isFeatured: d.isFeatured,
  }));
}

export async function getHomeServices() {
  await connection();
  await connectDB();
  const services = await Service.find({ isActive: true, showOnWebsite: true })
    .populate("doctor", "fullName slug specialization profileImage")
    .sort({ createdAt: -1 })
    .lean();

  return services.map((s: any) => ({
    _id: String(s._id),
    name: s.name,
    slug: s.slug,
    description: s.description || "",
    image: s.image || "",
    price: s.price,
    durationMinutes: s.durationMinutes,
    currency: s.currency || "PKR",
    doctor:
      s.doctor && typeof s.doctor === "object"
        ? {
            _id: String(s.doctor._id),
            fullName: s.doctor.fullName,
            slug: s.doctor.slug,
            specialization: s.doctor.specialization,
            profileImage: s.doctor.profileImage,
          }
        : String(s.doctor || ""),
  }));
}

export async function getHomeSettings() {
  await connection();
  await connectDB();
  let settings = await ClinicSettings.findOne({ key: "default" }).lean();
  if (!settings) {
    settings = (await ClinicSettings.create({ key: "default" })).toObject();
  }
  return settings as any;
}

export async function getHomeDoctorAvailability() {
  await connection();
  await connectDB();
  const doctors = await Doctor.find({ isActive: true })
    .sort({ sortOrder: 1, fullName: 1 })
    .select("fullName slug specialization")
    .lean();

  const rows = [];
  for (const doctor of doctors) {
    const availability = await DoctorAvailability.findOne({ doctor: doctor._id }).lean();
    const weekly = (availability?.weekly || [])
      .filter((d: any) => d.isAvailable && d.ranges?.length)
      .map((d: any) => ({
        day: DAY_LABELS[d.dayOfWeek] || String(d.dayOfWeek),
        dayOfWeek: d.dayOfWeek,
        ranges: d.ranges.map((r: any) => `${r.start} – ${r.end}`).join(", "),
      }))
      .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);

    rows.push({
      doctorId: String(doctor._id),
      fullName: doctor.fullName,
      slug: doctor.slug,
      specialization: doctor.specialization,
      weekly,
      hasSchedule: weekly.length > 0,
    });
  }
  return rows;
}
