import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchReceipt } from "@/lib/api/site";
import { ReceiptClient } from "./ReceiptClient";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Appointment Receipt",
  description: "Medical Complex appointment receipt",
};

async function ReceiptBody({ token }: { token: string }) {
  let data;
  try {
    data = await fetchReceipt(token);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <ReceiptClient data={data} token={token} />
    </div>
  );
}

export default async function ReceiptPage({ params }: Props) {
  const { token } = await params;
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted">
          Loading receipt…
        </div>
      }
    >
      <ReceiptBody token={token} />
    </Suspense>
  );
}
