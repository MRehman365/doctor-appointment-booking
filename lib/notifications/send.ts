import nodemailer from "nodemailer";
import { Notification } from "@/lib/models/Notification";
import { ClinicSettings } from "@/lib/models/ClinicSettings";
import { formatCurrency, formatDate, formatTime, padToken } from "@/lib/utils/format";

async function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function logNotification(data: {
  channel: "email" | "sms" | "whatsapp" | "in_app";
  type: string;
  recipient: string;
  subject?: string;
  body: string;
  status: "queued" | "sent" | "failed" | "skipped";
  error?: string;
  meta?: unknown;
}) {
  return Notification.create({
    ...data,
    sentAt: data.status === "sent" ? new Date() : undefined,
  });
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  type: string;
  meta?: unknown;
}) {
  const transporter = await getTransporter();
  if (!transporter) {
    await logNotification({
      channel: "email",
      type: options.type,
      recipient: options.to,
      subject: options.subject,
      body: options.html,
      status: "skipped",
      meta: options.meta,
      error: "SMTP not configured",
    });
    return { skipped: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@clinic.local",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    await logNotification({
      channel: "email",
      type: options.type,
      recipient: options.to,
      subject: options.subject,
      body: options.html,
      status: "sent",
      meta: options.meta,
    });
    return { sent: true };
  } catch (error) {
    await logNotification({
      channel: "email",
      type: options.type,
      recipient: options.to,
      subject: options.subject,
      body: options.html,
      status: "failed",
      error: error instanceof Error ? error.message : "send failed",
      meta: options.meta,
    });
    return { sent: false };
  }
}

export async function sendSms(options: {
  to: string;
  body: string;
  type: string;
  meta?: unknown;
}) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    await logNotification({
      channel: "sms",
      type: options.type,
      recipient: options.to,
      body: options.body,
      status: "skipped",
      error: "Twilio not configured",
      meta: options.meta,
    });
    return { skipped: true };
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: options.to, From: from, Body: options.body }),
      },
    );
    if (!res.ok) throw new Error(await res.text());
    await logNotification({
      channel: "sms",
      type: options.type,
      recipient: options.to,
      body: options.body,
      status: "sent",
      meta: options.meta,
    });
    return { sent: true };
  } catch (error) {
    await logNotification({
      channel: "sms",
      type: options.type,
      recipient: options.to,
      body: options.body,
      status: "failed",
      error: error instanceof Error ? error.message : "send failed",
      meta: options.meta,
    });
    return { sent: false };
  }
}

export async function sendAppointmentConfirmedNotifications(appointment: any) {
  const settings = await ClinicSettings.findOne({ key: "default" });
  const clinic = settings?.clinicName || "Clinic";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const receiptUrl = `${appUrl}/receipt/${appointment.receiptToken}`;
  const doctorName = appointment.doctor?.fullName || "Doctor";
  const serviceName = appointment.service?.name || "Consultation";
  const patientId = appointment.patient?.patientId || "";
  const queue = padToken(appointment.queueNumber || 0);

  const subject = `${clinic} — Appointment Confirmed (${appointment.appointmentNumber})`;
  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a2e28">
      <h1 style="font-size:22px">${clinic}</h1>
      <p>Your appointment is confirmed. Please show your receipt at reception.</p>
      <p><strong>Patient ID:</strong> ${patientId}<br/>
      <strong>Appointment:</strong> ${appointment.appointmentNumber}<br/>
      <strong>Queue:</strong> ${queue}<br/>
      <strong>Doctor:</strong> ${doctorName}<br/>
      <strong>Service:</strong> ${serviceName}<br/>
      <strong>Date:</strong> ${formatDate(appointment.date)}<br/>
      <strong>Time:</strong> ${formatTime(appointment.startTime)}<br/>
      <strong>Fee:</strong> ${formatCurrency(appointment.fee, appointment.currency)}</p>
      <p><a href="${receiptUrl}">Download / view receipt</a></p>
    </div>
  `;

  await sendEmail({
    to: appointment.patientDetails.email,
    subject,
    html,
    type: "appointment_confirmed",
    meta: { appointmentId: String(appointment._id) },
  });

  await sendSms({
    to: appointment.patientDetails.phone,
    body: `${clinic}: Appointment ${appointment.appointmentNumber} confirmed with ${doctorName} on ${formatDate(appointment.date)} at ${formatTime(appointment.startTime)}. Queue #${queue}. Receipt: ${receiptUrl}`,
    type: "appointment_confirmed",
    meta: { appointmentId: String(appointment._id) },
  });

  if (appointment.doctor?.contactEmail) {
    await sendEmail({
      to: appointment.doctor.contactEmail,
      subject: `New appointment — ${appointment.appointmentNumber}`,
      html: `<p>New confirmed booking with queue #${queue} on ${formatDate(appointment.date)} at ${formatTime(appointment.startTime)}.</p>`,
      type: "doctor_new_appointment",
      meta: { appointmentId: String(appointment._id) },
    });
  }
}
