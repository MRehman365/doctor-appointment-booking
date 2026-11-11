import { z } from "zod";

export const patientDetailsSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  age: z.number().int().min(0).max(120).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const createBookingSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  patient: patientDetailsSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  durationMinutes: z.number().int().min(5).max(240),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  showOnWebsite: z.boolean().optional(),
});

export const weeklyAvailabilitySchema = z.object({
  timezone: z.string().optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  maxDailyAppointments: z.number().int().min(1).max(200).optional(),
  weekly: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isAvailable: z.boolean(),
      ranges: z.array(z.object({ start: z.string(), end: z.string() })),
      breaks: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
    }),
  ),
});
