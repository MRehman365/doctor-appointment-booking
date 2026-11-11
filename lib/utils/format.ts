import { format, parseISO } from "date-fns";

export function formatCurrency(amount: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date, pattern = "dd MMMM yyyy") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return format(date, "hh:mm a");
}

export function padToken(n: number, size = 3) {
  return String(n).padStart(size, "0");
}
