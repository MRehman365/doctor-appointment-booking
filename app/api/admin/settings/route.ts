import { connectDB } from "@/lib/db";
import { ClinicSettings } from "@/lib/models/ClinicSettings";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/utils/errors";

export async function GET() {
  try {
    await connectDB();
    let settings = await ClinicSettings.findOne({ key: "default" });
    if (!settings) {
      settings = await ClinicSettings.create({ key: "default" });
    }
    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth(["admin"]);
    await connectDB();
    const body = await request.json();
    const settings = await ClinicSettings.findOneAndUpdate(
      { key: "default" },
      { $set: body },
      { upsert: true, returnDocument: "after" },
    );
    return ok(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
