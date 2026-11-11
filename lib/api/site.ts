import { connection } from "next/server";

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = { success: false; error: string; code?: string };

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  await connection();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const json = (await res.json()) as ApiSuccess<T> | ApiFailure;
  if (!res.ok || !json.success) {
    throw new Error(!json.success ? json.error : `Request failed: ${path}`);
  }
  return json.data;
}

export type ClinicSettings = {
  clinicName: string;
  logo?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  mapEmbedUrl?: string;
  timezone?: string;
  currency?: string;
  hero?: {
    heading?: string;
    description?: string;
    image?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  about?: {
    title?: string;
    body?: string;
    image?: string;
  };
  whyChooseUs?: { title?: string; description?: string; icon?: string }[];
  testimonials?: { name?: string; quote?: string; role?: string; rating?: number }[];
  faqs?: { question?: string; answer?: string }[];
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  cancellationPolicy?: string;
  refundPolicy?: string;
};

export type Doctor = {
  _id: string;
  fullName: string;
  slug: string;
  title?: string;
  specialization: string;
  qualifications?: string[];
  experienceYears?: number;
  biography?: string;
  shortDescription?: string;
  languages?: string[];
  profileImage?: string;
  clinicLocation?: string;
  consultationFeeFrom?: number;
  isFeatured?: boolean;
};

export type Service = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price: number;
  durationMinutes: number;
  currency?: string;
  doctor?: Doctor | string;
};

export function fetchSettings() {
  return apiGet<ClinicSettings>("/api/admin/settings");
}

export function fetchDoctors() {
  return apiGet<Doctor[]>("/api/doctors");
}

export function fetchDoctor(idOrSlug: string) {
  return apiGet<{ doctor: Doctor; services: Service[] }>(`/api/doctors/${idOrSlug}`);
}

export function fetchWebsiteServices() {
  return apiGet<Service[]>("/api/services?website=1");
}

export function fetchReceipt(token: string) {
  return apiGet<{
    appointment: Record<string, unknown>;
    clinic: ClinicSettings | null;
  }>(`/api/receipt/${token}`);
}

export function fetchVerification(token: string) {
  return apiGet<{
    valid: boolean;
    appointmentNumber?: string;
    queueNumber?: number;
    status?: string;
    paymentStatus?: string;
    date?: string;
    startTime?: string;
    doctor?: string;
    patientId?: string;
    patientName?: string;
  }>(`/api/verify/${token}`);
}
