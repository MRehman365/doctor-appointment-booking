import mongoose from "mongoose";

let supportsTransactions: boolean | null = null;

async function canUseTransactions() {
  if (supportsTransactions !== null) return supportsTransactions;
  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) {
      supportsTransactions = false;
      return false;
    }
    const info = await admin.command({ hello: 1 });
    supportsTransactions = Boolean(info.setName || info.msg === "isdbgrid");
  } catch {
    supportsTransactions = false;
  }
  return supportsTransactions;
}

/**
 * Runs work in a MongoDB transaction when supported (replica set / mongos).
 * Falls back to non-transactional execution on standalone MongoDB.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  if (!(await canUseTransactions())) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    try {
      await session.abortTransaction();
    } catch {
      // ignore
    }
    if (
      error?.code === 20 ||
      error?.codeName === "IllegalOperation" ||
      /transaction numbers|replica set|retryable writes/i.test(
        String(error?.message || ""),
      )
    ) {
      supportsTransactions = false;
      return fn(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
}
