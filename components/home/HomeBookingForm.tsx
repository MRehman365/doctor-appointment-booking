"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Doctor } from "@/lib/api/site";

export function HomeBookingForm({
  doctors,
  variant = "card",
}: {
  doctors: Doctor[];
  variant?: "card" | "light";
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (doctor) params.set("doctor", doctor);
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    if (date) params.set("date", date);
    router.push(`/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={variant === "card" ? "card space-y-4" : "space-y-4"}
    >
      <Input
        label="Your name"
        name="name"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Select
        label="Doctor"
        name="doctor"
        value={doctor}
        onChange={(e) => setDoctor(e.target.value)}
        required
      >
        <option value="">Select a doctor</option>
        {doctors.map((d) => (
          <option key={d._id} value={d.slug}>
            {d.fullName}
          </option>
        ))}
      </Select>
      <Input
        label="Preferred date"
        name="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Button type="submit" variant="accent" className="w-full" size="lg">
        Continue booking
      </Button>
    </form>
  );
}
