/**
 * Seeds demo clinic data so you can explore the UI.
 * - Admin + Reception accounts
 * - 3 doctors (with login) + services + weekly availability
 * - Patients, payments, today's / upcoming appointments
 *
 * Usage: npm run seed
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI in .env.local");
  process.exit(1);
}

function token(n = 24) {
  return randomBytes(n).toString("base64url").slice(0, n);
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

/* -------------------- schemas (lightweight mirrors) -------------------- */
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "receptionist"], required: true },
    name: { type: String, required: true },
    phone: String,
    isActive: { type: Boolean, default: true },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true },
);

const DoctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: String,
    slug: { type: String, unique: true },
    title: String,
    specialization: String,
    qualifications: [String],
    experienceYears: Number,
    biography: String,
    shortDescription: String,
    languages: [String],
    profileImage: String,
    clinicLocation: String,
    contactEmail: String,
    contactPhone: String,
    consultationFeeFrom: Number,
    bufferMinutes: { type: Number, default: 0 },
    maxDailyAppointments: { type: Number, default: 40 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ServiceSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    name: String,
    slug: String,
    description: String,
    image: { type: String, default: "" },
    price: Number,
    durationMinutes: Number,
    currency: { type: String, default: "PKR" },
    isActive: { type: Boolean, default: true },
    showOnWebsite: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const AvailabilitySchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", unique: true },
    timezone: { type: String, default: "Asia/Karachi" },
    weekly: Array,
    bufferMinutes: { type: Number, default: 0 },
    maxDailyAppointments: { type: Number, default: 40 },
  },
  { timestamps: true },
);

const PatientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true },
    fullName: String,
    email: String,
    phone: String,
    age: Number,
    gender: String,
    registrationDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const PaymentSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", unique: true },
    reference: { type: String, unique: true },
    amount: Number,
    currency: { type: String, default: "PKR" },
    status: String,
    provider: String,
    method: String,
    paidAt: Date,
  },
  { timestamps: true },
);

const AppointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: { type: String, unique: true, sparse: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    patientDetails: {
      fullName: String,
      email: String,
      phone: String,
      age: Number,
      gender: String,
      reason: String,
      notes: String,
    },
    date: String,
    startTime: String,
    endTime: String,
    durationMinutes: Number,
    fee: Number,
    currency: { type: String, default: "PKR" },
    status: String,
    queueNumber: Number,
    queueOrder: Number,
    confirmedAt: Date,
    checkedInAt: Date,
    completedAt: Date,
    receiptToken: { type: String, unique: true, sparse: true },
    verificationToken: { type: String, unique: true, sparse: true },
    statusHistory: Array,
  },
  { timestamps: true },
);

const CounterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

const QueueCounterSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    date: String,
    lastNumber: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const ClinicSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    clinicName: String,
    logo: String,
    tagline: String,
    address: String,
    phone: String,
    email: String,
    hero: Object,
    about: Object,
    whyChooseUs: Array,
    testimonials: Array,
    faqs: Array,
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
const Service = mongoose.models.Service || mongoose.model("Service", ServiceSchema);
const DoctorAvailability =
  mongoose.models.DoctorAvailability || mongoose.model("DoctorAvailability", AvailabilitySchema);
const Patient = mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
const Appointment =
  mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);
const QueueCounter =
  mongoose.models.QueueCounter || mongoose.model("QueueCounter", QueueCounterSchema);
const ClinicSettings =
  mongoose.models.ClinicSettings || mongoose.model("ClinicSettings", ClinicSettingsSchema);

async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  return doc.seq;
}

async function upsertUser({ email, password, name, role, phone = "" }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const normalized = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalized });
  if (!user) {
    user = await User.create({
      email: normalized,
      passwordHash,
      name,
      role,
      phone,
      isActive: true,
    });
  } else {
    user.passwordHash = passwordHash;
    user.name = name;
    user.role = role;
    user.isActive = true;
    if (phone) user.phone = phone;
    await user.save();
  }
  return user;
}

async function upsertDoctor(user, data) {
  let doctor = await Doctor.findOne({ user: user._id });
  if (!doctor) {
    doctor = await Doctor.create({ ...data, user: user._id });
  } else {
    Object.assign(doctor, data);
    await doctor.save();
  }
  user.doctorProfile = doctor._id;
  await user.save();
  return doctor;
}

const defaultWeekly = [1, 2, 3, 4, 5]
  .map((dayOfWeek) => ({
    dayOfWeek,
    isAvailable: true,
    ranges: [
      { start: "09:00", end: "13:00" },
      { start: "16:00", end: "20:00" },
    ],
    breaks: [{ start: "11:00", end: "11:15" }],
  }))
  .concat([
    { dayOfWeek: 0, isAvailable: false, ranges: [], breaks: [] },
    {
      dayOfWeek: 6,
      isAvailable: true,
      ranges: [{ start: "10:00", end: "14:00" }],
      breaks: [],
    },
  ]);

async function main() {
  await mongoose.connect(uri, { bufferCommands: false });
  const year = new Date().getFullYear();
  const today = ymd(new Date());
  const tomorrow = ymd(addDays(new Date(), 1));
  const dayAfter = ymd(addDays(new Date(), 2));

  console.log("Seeding Medical Complex demo data…");

  const admin = await upsertUser({
    email: process.env.SEED_ADMIN_EMAIL || "admin@gmail.com",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin12345",
    name: "Clinic Admin",
    role: "admin",
  });

  const reception = await upsertUser({
    email: process.env.SEED_RECEPTION_EMAIL || "reception@gmail.com",
    password: process.env.SEED_RECEPTION_PASSWORD || "Reception12345",
    name: "Front Desk Reception",
    role: "receptionist",
    phone: "+44 20 7946 0958",
  });

  const doctorDefs = [
    {
      email: "doctor@gmail.com",
      password: process.env.SEED_DOCTOR_PASSWORD || "Doctor12345",
      fullName: "Dr. Ayesha Khan",
      slug: "dr-ayesha-khan",
      title: "Consultant Physician",
      specialization: "General Medicine",
      qualifications: ["MBBS", "FCPS"],
      experienceYears: 12,
      shortDescription: "Primary care, chronic disease follow-ups, and general consultations.",
      biography:
        "Dr. Ayesha Khan focuses on preventive medicine and clear treatment plans for everyday health concerns.",
      languages: ["English", "Urdu"],
      profileImage: "/people-01.jpg",
      contactPhone: "+44 7700 900101",
      consultationFeeFrom: 1500,
      isFeatured: true,
      sortOrder: 1,
      services: [
        {
          name: "General Consultation",
          slug: "general-consultation",
          description: "Full clinical assessment and treatment plan.",
          price: 1500,
          durationMinutes: 15,
        },
        {
          name: "Follow-up Consultation",
          slug: "follow-up-consultation",
          description: "Review of previous treatment and progress.",
          price: 1000,
          durationMinutes: 15,
        },
      ],
    },
    {
      email: "dr.hassan@gmail.com",
      password: "Doctor12345",
      fullName: "Dr. Hassan Ali",
      slug: "dr-hassan-ali",
      title: "Cardiologist",
      specialization: "Cardiology",
      qualifications: ["MBBS", "MD Cardiology"],
      experienceYears: 15,
      shortDescription: "Heart health consultations and cardiac risk assessments.",
      biography:
        "Dr. Hassan Ali helps patients manage blood pressure, cholesterol, and cardiac symptoms with practical follow-up plans.",
      languages: ["English", "Urdu"],
      profileImage: "/doctors-9.png",
      contactPhone: "+44 7700 900102",
      consultationFeeFrom: 2500,
      isFeatured: true,
      sortOrder: 2,
      services: [
        {
          name: "Cardiac Consultation",
          slug: "cardiac-consultation",
          description: "Specialist heart consultation and risk review.",
          price: 2500,
          durationMinutes: 30,
        },
        {
          name: "ECG Review",
          slug: "ecg-review",
          description: "ECG interpretation and next-step guidance.",
          price: 1800,
          durationMinutes: 20,
        },
      ],
    },
    {
      email: "dr.sara@gmail.com",
      password: "Doctor12345",
      fullName: "Dr. Sara Malik",
      slug: "dr-sara-malik",
      title: "Dermatologist",
      specialization: "Dermatology",
      qualifications: ["MBBS", "MCPS Dermatology"],
      experienceYears: 9,
      shortDescription: "Skin consultations for acne, allergies, and routine dermatology care.",
      biography:
        "Dr. Sara Malik provides calm, clear dermatology advice with practical treatment options.",
      languages: ["English", "Urdu"],
      profileImage: "/10-109014_female-doctor-transparent-images-medical-assistant.png",
      contactPhone: "+44 7700 900103",
      consultationFeeFrom: 2000,
      isFeatured: false,
      sortOrder: 3,
      services: [
        {
          name: "Skin Consultation",
          slug: "skin-consultation",
          description: "Dermatology assessment and treatment advice.",
          price: 2000,
          durationMinutes: 25,
        },
        {
          name: "Acne Follow-up",
          slug: "acne-follow-up",
          description: "Progress review for ongoing skin treatment.",
          price: 1500,
          durationMinutes: 15,
        },
      ],
    },
  ];

  const doctors = [];
  for (const def of doctorDefs) {
    const user = await upsertUser({
      email: def.email,
      password: def.password,
      name: def.fullName,
      role: "doctor",
      phone: def.contactPhone,
    });
    const doctor = await upsertDoctor(user, {
      fullName: def.fullName,
      slug: def.slug,
      title: def.title,
      specialization: def.specialization,
      qualifications: def.qualifications,
      experienceYears: def.experienceYears,
      shortDescription: def.shortDescription,
      biography: def.biography,
      languages: def.languages,
      profileImage: def.profileImage,
      clinicLocation: "Medical Complex, Main Boulevard",
      contactEmail: def.email,
      contactPhone: def.contactPhone,
      consultationFeeFrom: def.consultationFeeFrom,
      isFeatured: def.isFeatured,
      sortOrder: def.sortOrder,
      isActive: true,
    });

    await DoctorAvailability.findOneAndUpdate(
      { doctor: doctor._id },
      {
        doctor: doctor._id,
        timezone: "Asia/Karachi",
        bufferMinutes: 0,
        maxDailyAppointments: 30,
        weekly: defaultWeekly,
      },
      { upsert: true },
    );

    const serviceDocs = [];
    for (const svc of def.services) {
      let service = await Service.findOne({ doctor: doctor._id, slug: svc.slug });
      if (!service) {
        service = await Service.create({
          doctor: doctor._id,
          ...svc,
          image: "",
          isActive: true,
          showOnWebsite: true,
        });
      } else {
        Object.assign(service, svc, { isActive: true, showOnWebsite: true });
        await service.save();
      }
      serviceDocs.push(service);
    }

    doctors.push({ doctor, user, services: serviceDocs, def });
  }

  const patientDefs = [
    {
      patientId: `PAT-${year}-00001`,
      fullName: "Ali Raza",
      email: "ali.raza@example.com",
      phone: "+447700900201",
      age: 32,
      gender: "male",
    },
    {
      patientId: `PAT-${year}-00002`,
      fullName: "Fatima Noor",
      email: "fatima.noor@example.com",
      phone: "+447700900202",
      age: 27,
      gender: "female",
    },
    {
      patientId: `PAT-${year}-00003`,
      fullName: "Bilal Ahmed",
      email: "bilal.ahmed@example.com",
      phone: "+447700900203",
      age: 41,
      gender: "male",
    },
    {
      patientId: `PAT-${year}-00004`,
      fullName: "Hina Siddiqui",
      email: "hina.siddiqui@example.com",
      phone: "+447700900204",
      age: 35,
      gender: "female",
    },
    {
      patientId: `PAT-${year}-00005`,
      fullName: "Usman Tariq",
      email: "usman.tariq@example.com",
      phone: "+447700900205",
      age: 29,
      gender: "male",
    },
  ];

  const patients = [];
  for (const p of patientDefs) {
    let patient = await Patient.findOne({ patientId: p.patientId });
    if (!patient) patient = await Patient.create(p);
    else {
      Object.assign(patient, p);
      await patient.save();
    }
    patients.push(patient);
  }

  // Clear previous demo appointments so re-seed stays clean
  await Appointment.deleteMany({ appointmentNumber: { $regex: `^APT-${year}-DEMO` } });
  await Payment.deleteMany({ reference: { $regex: `^PAY-DEMO-${year}` } });

  const demoBookings = [
    {
      doctorIndex: 0,
      serviceIndex: 0,
      patientIndex: 0,
      date: today,
      startTime: "09:00",
      endTime: "09:15",
      status: "checked_in",
      queue: 1,
    },
    {
      doctorIndex: 0,
      serviceIndex: 1,
      patientIndex: 1,
      date: today,
      startTime: "09:30",
      endTime: "09:45",
      status: "confirmed",
      queue: 2,
    },
    {
      doctorIndex: 0,
      serviceIndex: 0,
      patientIndex: 2,
      date: today,
      startTime: "10:00",
      endTime: "10:15",
      status: "confirmed",
      queue: 3,
    },
    {
      doctorIndex: 1,
      serviceIndex: 0,
      patientIndex: 3,
      date: today,
      startTime: "10:00",
      endTime: "10:30",
      status: "in_consultation",
      queue: 1,
    },
    {
      doctorIndex: 1,
      serviceIndex: 1,
      patientIndex: 4,
      date: today,
      startTime: "11:00",
      endTime: "11:20",
      status: "confirmed",
      queue: 2,
    },
    {
      doctorIndex: 2,
      serviceIndex: 0,
      patientIndex: 1,
      date: tomorrow,
      startTime: "10:30",
      endTime: "10:55",
      status: "confirmed",
      queue: 1,
    },
    {
      doctorIndex: 0,
      serviceIndex: 0,
      patientIndex: 3,
      date: tomorrow,
      startTime: "16:00",
      endTime: "16:15",
      status: "confirmed",
      queue: 1,
    },
    {
      doctorIndex: 2,
      serviceIndex: 1,
      patientIndex: 0,
      date: dayAfter,
      startTime: "11:00",
      endTime: "11:15",
      status: "completed",
      queue: 1,
    },
  ];

  let demoSeq = 0;
  for (const booking of demoBookings) {
    demoSeq += 1;
    const { doctor, services } = doctors[booking.doctorIndex];
    const service = services[booking.serviceIndex];
    const patient = patients[booking.patientIndex];
    const appointmentNumber = `APT-${year}-DEMO${String(demoSeq).padStart(3, "0")}`;
    const paymentReference = `PAY-DEMO-${year}-${String(demoSeq).padStart(3, "0")}`;

    const appointment = await Appointment.create({
      appointmentNumber,
      doctor: doctor._id,
      service: service._id,
      patient: patient._id,
      patientDetails: {
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        reason: "Demo booking for UI review",
        notes: "",
      },
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMinutes: service.durationMinutes,
      fee: service.price,
      currency: "PKR",
      status: booking.status,
      queueNumber: booking.queue,
      queueOrder: booking.queue,
      confirmedAt: new Date(),
      checkedInAt: booking.status === "checked_in" || booking.status === "in_consultation" ? new Date() : undefined,
      completedAt: booking.status === "completed" ? new Date() : undefined,
      receiptToken: token(24),
      verificationToken: token(24),
      statusHistory: [
        { status: "confirmed", at: new Date(), note: "Demo seed" },
        ...(booking.status !== "confirmed"
          ? [{ status: booking.status, at: new Date(), note: "Demo seed status" }]
          : []),
      ],
    });

    const payment = await Payment.create({
      appointment: appointment._id,
      reference: paymentReference,
      amount: service.price,
      currency: "PKR",
      status: "paid",
      provider: "mock",
      method: "online",
      paidAt: new Date(),
    });

    appointment.payment = payment._id;
    await appointment.save();

    await QueueCounter.findOneAndUpdate(
      { doctor: doctor._id, date: booking.date },
      { $max: { lastNumber: booking.queue } },
      { upsert: true },
    );
  }

  // Keep counters ahead of demo IDs
  await Counter.findOneAndUpdate(
    { key: `patient-${year}` },
    { $max: { seq: 5 } },
    { upsert: true },
  );
  await Counter.findOneAndUpdate(
    { key: `appointment-${year}` },
    { $max: { seq: 20 } },
    { upsert: true },
  );

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
        heading: "Care For Your Health",
        description:
          "Choose a doctor, pick a live slot, pay securely, and walk in with your digital receipt — no account needed.",
        image: "/doctor.png",
        ctaLabel: "Book Appointment",
        ctaHref: "/book",
      },
      about: {
        title: "A clinic built around your time",
        body: "Medical Complex combines experienced specialists with a modern booking experience so patients spend less time waiting.",
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
          description: "Slots update as appointments are reserved and confirmed.",
          icon: "calendar",
        },
        {
          title: "Reception-ready receipts",
          description: "Patient ID, queue token, and QR verification on every booking.",
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
          question: "Do I need an account?",
          answer: "No. Enter your details during booking and pay to confirm.",
        },
        {
          question: "When is my queue number assigned?",
          answer: "Only after successful payment confirmation.",
        },
      ],
    },
    { upsert: true },
  );

  console.log("\n✅ Demo data ready\n");
  console.log("Staff logins (/login):");
  console.log(`  Admin      ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || "Admin12345"}`);
  console.log(
    `  Reception  ${reception.email} / ${process.env.SEED_RECEPTION_PASSWORD || "Reception12345"}`,
  );
  console.log("  Doctors:");
  for (const d of doctors) {
    console.log(`    ${d.def.email} / ${d.def.password}  (${d.def.fullName})`);
  }
  console.log("\nExplore:");
  console.log("  /                 public website + doctors/services");
  console.log("  /dashboard/admin  stats, patients, appointments");
  console.log("  /dashboard/doctor queue + today's appointments");
  console.log("  /dashboard/reception check-in + waiting queue");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
