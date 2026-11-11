import { connectDB } from "@/lib/db";
import { Appointment } from "@/lib/models/Appointment";
import { Doctor } from "@/lib/models/Doctor";
import { Patient } from "@/lib/models/Patient";
import { Payment } from "@/lib/models/Payment";
import { requireAuth } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/utils/errors";

export async function GET() {
  try {
    await requireAuth(["admin"]);
    await connectDB();

    const today = new Date().toISOString().slice(0, 10);

    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayBookings,
      paidPayments,
      pendingPayments,
      completedAppointments,
    ] = await Promise.all([
      Doctor.countDocuments({ isActive: true }),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        date: today,
        status: { $nin: ["expired", "cancelled"] },
      }),
      Payment.find({ status: "paid" }).select("amount"),
      Payment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "completed" }),
    ]);

    const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const doctorPerformance = await Appointment.aggregate([
      { $match: { status: { $in: ["confirmed", "completed", "checked_in", "in_consultation"] } } },
      {
        $group: {
          _id: "$doctor",
          appointments: { $sum: 1 },
          revenue: { $sum: "$fee" },
        },
      },
      { $sort: { appointments: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          doctorName: "$doctor.fullName",
          specialization: "$doctor.specialization",
          appointments: 1,
          revenue: 1,
        },
      },
    ]);

    return ok({
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayBookings,
      totalRevenue,
      pendingPayments,
      completedAppointments,
      doctorPerformance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
