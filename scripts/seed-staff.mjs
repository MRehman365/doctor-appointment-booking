/**
 * Seeds Admin + Reception accounts into MongoDB from .env.local
 * Usage: node scripts/seed-staff.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
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

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "doctor", "receptionist"], required: true },
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function upsert({ email, password, name, role, phone = "" }) {
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
    return { email: normalized, role, status: "created" };
  }
  user.passwordHash = passwordHash;
  user.name = name;
  user.role = role;
  user.isActive = true;
  if (phone) user.phone = phone;
  await user.save();
  return { email: normalized, role, status: "updated" };
}

async function main() {
  await mongoose.connect(uri, { bufferCommands: false });

  const admin = await upsert({
    email: process.env.SEED_ADMIN_EMAIL || "admin@clinic.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    name: "Clinic Admin",
    role: "admin",
  });

  const reception = await upsert({
    email: process.env.SEED_RECEPTION_EMAIL || "reception@clinic.local",
    password: process.env.SEED_RECEPTION_PASSWORD || "Reception@12345",
    name: "Front Desk Reception",
    role: "receptionist",
    phone: "+44 7700 900001",
  });

  console.log("Staff accounts saved to MongoDB:");
  console.log(JSON.stringify({ admin, reception }, null, 2));
  console.log("\nLogin at /login");
  console.log(`Admin: ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD}`);
  console.log(`Reception: ${reception.email} / ${process.env.SEED_RECEPTION_PASSWORD}`);
  console.log("\nCreate doctors from Admin Dashboard → Doctors");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
