"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";

type ReceiptData = {
  appointment: any;
  clinic: any;
};

export function ReceiptClient({ data, token }: { data: ReceiptData; token: string }) {
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const apt = data.appointment;
  const clinic = data.clinic;
  const patient = apt.patient || {};
  const doctor = apt.doctor || {};
  const service = apt.service || {};
  const payment = apt.payment || {};
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${apt.verificationToken || token}`
      : `/verify/${apt.verificationToken || token}`;

  useEffect(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/${apt.verificationToken || token}`
        : verifyUrl;
    QRCode.toDataURL(url, {
      width: 360,
      margin: 1,
      color: { dark: "#1d3448", light: "#FFFFFF" },
    }).then(setQr);
  }, [apt.verificationToken, token, verifyUrl]);

  const rows: [string, string][] = [
    ["Patient", patient.fullName || apt.patientDetails?.fullName || "—"],
    ["Patient ID", patient.patientId || "Assigned at confirmation"],
    ["Doctor", doctor.fullName || "—"],
    [
      "Service",
      `${service.name || "Consultation"}${
        service.durationMinutes ? ` · ${service.durationMinutes} min` : ""
      }`,
    ],
    [
      "Date & time",
      `${apt.date ? formatDate(apt.date) : "—"} · ${
        apt.startTime ? formatTime(apt.startTime) : ""
      }${apt.endTime ? ` – ${formatTime(apt.endTime)}` : ""}`,
    ],
    ["Queue number", apt.queueNumber != null ? String(apt.queueNumber).padStart(3, "0") : "—"],
    ["Amount paid", formatCurrency(apt.fee || payment.amount || 0, apt.currency || "PKR")],
    ["Payment ref", payment.reference || "—"],
    ["Status", String(apt.status || "").replaceAll("_", " ")],
  ];

  async function handleDownload() {
    if (!qr) return;
    setDownloading(true);
    try {
      const canvas = await drawReceipt({
        clinicName: clinic?.clinicName || "Medical Complex",
        address: clinic?.address || "",
        phone: clinic?.phone || "",
        aptNumber: apt.appointmentNumber || "—",
        rows,
        qr,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `medical-complex-receipt-${apt.appointmentNumber || token}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="no-print mb-6 flex flex-wrap gap-3">
        <Button type="button" onClick={() => window.print()}>
          Print
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!qr || downloading}
          onClick={handleDownload}
        >
          {downloading ? "Preparing…" : "Download receipt"}
        </Button>
        <Button href="/book" variant="secondary">
          Book Another
        </Button>
      </div>

      <article className="print-sheet overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
        <header className="border-b border-border bg-surface-muted/70 px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Medical Complex"
                className="h-14 w-14 rounded-full object-cover ring-2 ring-brand/20"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">
                  Appointment receipt
                </p>
                <h1 className="mt-2 font-display text-3xl text-foreground">
                  {clinic?.clinicName || "Medical Complex"}
                </h1>
                <p className="mt-1 text-sm text-muted">{clinic?.address || ""}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-foreground">{apt.appointmentNumber || "—"}</p>
              <p className="text-muted">APT number</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8">
          <div className="space-y-5 text-sm">
            <Field label="Patient" value={patient.fullName || apt.patientDetails?.fullName || "—"} />
            <Field label="Patient ID" value={patient.patientId || "Assigned at confirmation"} />
            <Field label="Doctor" value={doctor.fullName || "—"} />
            <Field
              label="Service"
              value={`${service.name || "Consultation"}${
                service.durationMinutes ? ` · ${service.durationMinutes} min` : ""
              }`}
            />
            <Field
              label="Date & time"
              value={`${apt.date ? formatDate(apt.date) : "—"} · ${
                apt.startTime ? formatTime(apt.startTime) : ""
              }${apt.endTime ? ` – ${formatTime(apt.endTime)}` : ""}`}
            />
            <Field
              label="Queue number"
              value={apt.queueNumber != null ? String(apt.queueNumber).padStart(3, "0") : "—"}
            />
            <Field
              label="Amount paid"
              value={formatCurrency(apt.fee || payment.amount || 0, apt.currency || "PKR")}
            />
            <Field label="Payment ref" value={payment.reference || "—"} />
            <Field label="Status" value={String(apt.status || "").replaceAll("_", " ")} />
          </div>

          <div className="flex flex-col items-center justify-start gap-3 rounded-2xl border border-border bg-surface-muted/50 p-5 text-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Verification QR code" className="h-40 w-40 rounded-xl bg-white p-2" />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-xl bg-border" />
            )}
            <p className="text-xs leading-relaxed text-muted">
              Scan to verify this appointment at reception.
            </p>
          </div>
        </div>

        <footer className="border-t border-border px-6 py-5 text-xs text-muted md:px-8">
          Present this receipt at check-in. For assistance call {clinic?.phone || "the clinic"}.
        </footer>
      </article>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-muted-soft">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}

type DrawInput = {
  clinicName: string;
  address: string;
  phone: string;
  aptNumber: string;
  rows: [string, string][];
  qr: string;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

/** Draws the complete receipt (header, details, QR, footer) as one PNG canvas. */
async function drawReceipt({ clinicName, address, phone, aptNumber, rows, qr }: DrawInput) {
  if (document.fonts?.ready) await document.fonts.ready;
  const family = getComputedStyle(document.body).fontFamily || "Inter, Arial, sans-serif";
  const [logo, qrImg] = await Promise.all([loadImage("/logo.png"), loadImage(qr)]);

  const scale = 2;
  const W = 800;
  const pad = 40;
  const navy = "#1d3448";
  const muted = "#5b6b7a";
  const border = "#e2e8ee";
  const leftW = 450;
  const qrBoxX = 540;
  const qrBoxW = W - pad - qrBoxX;
  const headerH = 130;
  const footerH = 64;

  // measure rows first so the canvas height fits the content
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 15px ${family}`;
  const laidOut = rows.map(([label, value]) => ({
    label,
    lines: wrap(measure, value, leftW),
  }));
  const rowsH = laidOut.reduce((sum, r) => sum + 20 + r.lines.length * 20 + 18, 0);
  const bodyH = Math.max(rowsH, 300) + pad * 1.4;
  const H = headerH + bodyH + footerH;

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";

  // page
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = "#f3f8fb";
  ctx.fillRect(0, 0, W, headerH);
  ctx.fillStyle = border;
  ctx.fillRect(0, headerH - 1, W, 1);

  let textX = pad;
  if (logo) {
    const size = 64;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pad + size / 2, 34 + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, pad, 34, size, size);
    ctx.restore();
    textX = pad + size + 16;
  }
  ctx.fillStyle = "#0f7f90";
  ctx.font = `700 11px ${family}`;
  ctx.fillText("APPOINTMENT RECEIPT", textX, 46);
  ctx.fillStyle = navy;
  ctx.font = `700 26px ${family}`;
  ctx.fillText(clinicName, textX, 78);
  ctx.fillStyle = muted;
  ctx.font = `400 13px ${family}`;
  const addrLines = wrap(ctx, address, 420).slice(0, 2);
  addrLines.forEach((l, i) => ctx.fillText(l, textX, 100 + i * 16));

  ctx.textAlign = "right";
  ctx.fillStyle = navy;
  ctx.font = `700 16px ${family}`;
  ctx.fillText(aptNumber, W - pad, 54);
  ctx.fillStyle = muted;
  ctx.font = `400 12px ${family}`;
  ctx.fillText("APT number", W - pad, 72);
  ctx.textAlign = "left";

  // details
  let y = headerH + pad + 6;
  for (const row of laidOut) {
    ctx.fillStyle = "#8a97a4";
    ctx.font = `600 11px ${family}`;
    ctx.fillText(row.label.toUpperCase(), pad, y);
    y += 20;
    ctx.fillStyle = navy;
    ctx.font = `600 15px ${family}`;
    for (const line of row.lines) {
      ctx.fillText(line, pad, y);
      y += 20;
    }
    y += 18 - 4;
    y += 4;
  }

  // QR panel
  const panelY = headerH + pad;
  const panelH = 270;
  ctx.fillStyle = "#f6f9fb";
  ctx.fillRect(qrBoxX, panelY, qrBoxW, panelH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(qrBoxX + 0.5, panelY + 0.5, qrBoxW - 1, panelH - 1);
  const qrSize = 170;
  const qrX = qrBoxX + (qrBoxW - qrSize) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(qrX - 8, panelY + 24 - 8, qrSize + 16, qrSize + 16);
  if (qrImg) ctx.drawImage(qrImg, qrX, panelY + 24, qrSize, qrSize);
  ctx.fillStyle = muted;
  ctx.font = `400 12px ${family}`;
  ctx.textAlign = "center";
  wrap(ctx, "Scan to verify this appointment at reception.", qrBoxW - 40).forEach((l, i) =>
    ctx.fillText(l, qrBoxX + qrBoxW / 2, panelY + 24 + qrSize + 36 + i * 16),
  );
  ctx.textAlign = "left";

  // footer
  ctx.fillStyle = border;
  ctx.fillRect(0, H - footerH, W, 1);
  ctx.fillStyle = muted;
  ctx.font = `400 12px ${family}`;
  ctx.fillText(
    `Present this receipt at check-in. For assistance call ${phone || "the clinic"}.`,
    pad,
    H - footerH / 2 + 4,
  );

  return canvas;
}