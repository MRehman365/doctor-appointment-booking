import { Schema, models, model } from "mongoose";

const CounterSchema = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export const Counter = models.Counter || model("Counter", CounterSchema);

export async function getNextSequence(key: string) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  return doc.seq as number;
}
