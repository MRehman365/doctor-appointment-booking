"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import type { Doctor } from "@/lib/api/site";

export function QuickDentistSelect({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState("");

  return (
    <div className="card">
      <h3 className="font-display text-xl text-navy md:text-2xl">Book Your Appointment</h3>
      <p className="mt-1 text-sm text-muted">Select your doctor and continue booking.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Select
            label="Select your doctor"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
          >
            <option value="">Select doctor here</option>
            {doctors.map((d) => (
              <option key={d._id} value={d.slug}>
                {d.fullName}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variant="accent"
          className="sm:mb-0.5"
          onClick={() =>
            router.push(doctor ? `/book?doctor=${encodeURIComponent(doctor)}` : "/book")
          }
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
