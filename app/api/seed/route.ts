import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { ClinicSettings } from "@/lib/models/ClinicSettings";
import { hashPassword } from "@/lib/auth/password";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

async function upsertStaffUser(input: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "receptionist";
  phone?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await hashPassword(input.password);
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      name: input.name,
      role: input.role,
      phone: input.phone || "",
      passwordHash,
      isActive: true,
    });
    return { user, created: true };
  }

  user.name = input.name;
  user.role = input.role;
  user.passwordHash = passwordHash;
  user.isActive = true;
  if (input.phone) user.phone = input.phone;
  await user.save();
  return { user, created: false };
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      const secret = request.headers.get("x-seed-secret");
      if (!secret || secret !== process.env.SESSION_SECRET) {
        throw new AppError("Seeding disabled in production", 403);
      }
    }

    await connectDB();

    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@clinic.local";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
    const receptionEmail = process.env.SEED_RECEPTION_EMAIL || "reception@clinic.local";
    const receptionPassword = process.env.SEED_RECEPTION_PASSWORD || "Reception@12345";

    if (!adminPassword || adminPassword.length < 8) {
      throw new AppError("SEED_ADMIN_PASSWORD must be at least 8 characters", 400);
    }
    if (!receptionPassword || receptionPassword.length < 8) {
      throw new AppError("SEED_RECEPTION_PASSWORD must be at least 8 characters", 400);
    }

    const adminResult = await upsertStaffUser({
      email: adminEmail,
      password: adminPassword,
      name: "Clinic Admin",
      role: "admin",
    });

    const receptionResult = await upsertStaffUser({
      email: receptionEmail,
      password: receptionPassword,
      name: "Front Desk Reception",
      role: "receptionist",
      phone: "+44 7700 900001",
    });

    await ClinicSettings.findOneAndUpdate(
      { key: "default" },
      {
        key: "default",
        clinicName: "Medical Complex",
        logo: "/logo.png",
        tagline: "Trusted care, booked in minutes",
        address: "45 Harley Street, London W1G 8QR, United Kingdom",
        phone: "+44 20 7946 0958",
        email: "hello@medicalcomplex.co.uk",
        hero: {
          heading: "Expert doctors. Instant booking. Confirmed care.",
          description:
            "Select your doctor, choose a service, pick a time, and pay securely — no account needed. Walk in with your digital receipt.",
          image: "/doctor.png",
          ctaLabel: "Book Appointment",
          ctaHref: "/book",
        },
        about: {
          title: "A clinic built around your time",
          body: "Medical Complex combines experienced specialists with an appointment system that eliminates phone queues and double bookings.",
          image: "/doctors-9.png",
        },
        whyChooseUs: [
          {
            title: "No account required",
            description: "Patients book and pay in one flow without creating logins.",
            icon: "shield",
          },
          {
            title: "Live availability",
            description: "Slots update in real time as appointments are reserved and confirmed.",
            icon: "calendar",
          },
          {
            title: "Reception-ready receipts",
            description: "Every booking issues a Patient ID, queue token, and QR verification.",
            icon: "receipt",
          },
        ],
        testimonials: [
          {
            name: "Sara M.",
            quote: "Booked in under three minutes and walked straight to reception with my receipt.",
            role: "Patient",
            rating: 5,
          },
          {
            name: "Omar R.",
            quote: "The queue number made the visit calm and organized.",
            role: "Patient",
            rating: 5,
          },
        ],
        faqs: [
          {
            question: "Do I need to create an account?",
            answer: "No. Enter your details once during booking and pay to confirm.",
          },
          {
            question: "When do I get my queue number?",
            answer: "Queue numbers are assigned only after successful payment confirmation.",
          },
          {
            question: "What should I show at reception?",
            answer: "Show your appointment receipt or QR code. Staff can also search by Patient ID.",
          },
        ],
      },
      { upsert: true, returnDocument: "after" },
    );

    return ok({
      seeded: true,
      note: "Doctors are created by Admin from Dashboard → Doctors. Reception/Admin accounts are stored in MongoDB.",
      accounts: {
        admin: {
          email: adminEmail,
          password: adminPassword,
          status: adminResult.created ? "created" : "updated",
        },
        reception: {
          email: receptionEmail,
          password: receptionPassword,
          status: receptionResult.created ? "created" : "updated",
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
