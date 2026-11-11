import { getNextSequence } from "@/lib/models/Counter";
import { QueueCounter } from "@/lib/models/QueueCounter";
import { Types } from "mongoose";
import { padToken } from "@/lib/utils/format";

export async function generatePatientId(year = new Date().getFullYear()) {
  const seq = await getNextSequence(`patient-${year}`);
  return `PAT-${year}-${padToken(seq, 5)}`;
}

export async function generateAppointmentNumber(year = new Date().getFullYear()) {
  const seq = await getNextSequence(`appointment-${year}`);
  return `APT-${year}-${padToken(seq, 5)}`;
}

export async function generatePaymentReference() {
  const seq = await getNextSequence(`payment-${new Date().getFullYear()}`);
  return `PAY-${Date.now()}-${padToken(seq, 4)}`;
}

export async function allocateQueueNumber(doctorId: string | Types.ObjectId, date: string) {
  const doc = await QueueCounter.findOneAndUpdate(
    { doctor: doctorId, date },
    { $inc: { lastNumber: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return doc.lastNumber as number;
}
