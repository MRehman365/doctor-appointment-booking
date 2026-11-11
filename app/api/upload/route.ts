import { requireAuth } from "@/lib/auth/guards";
import { uploadImage } from "@/lib/cloudinary";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

export async function POST(request: Request) {
  try {
    await requireAuth(["admin", "doctor"]);
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "clinic");

    if (!(file instanceof File)) throw new AppError("file is required");
    if (!file.type.startsWith("image/")) throw new AppError("Only images are allowed");
    if (file.size > 5 * 1024 * 1024) throw new AppError("Max image size is 5MB");

    const result = await uploadImage(file, folder);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
