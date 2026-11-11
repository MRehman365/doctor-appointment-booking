import { connectDB } from "@/lib/db";
import { Service } from "@/lib/models/Service";
import { requireDoctorOwn } from "@/lib/auth/guards";
import { serviceSchema } from "@/lib/validators/booking";
import { handleApiError, ok, AppError } from "@/lib/utils/errors";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id);
    if (!service) throw new AppError("Service not found", 404);
    await requireDoctorOwn(String(service.doctor));

    const body = serviceSchema.partial().parse(await request.json());
    Object.assign(service, body);
    await service.save();
    return ok(service);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id);
    if (!service) throw new AppError("Service not found", 404);
    await requireDoctorOwn(String(service.doctor));
    service.isActive = false;
    await service.save();
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
