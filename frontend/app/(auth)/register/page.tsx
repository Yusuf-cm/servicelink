"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input, Select } from "@/components/ui/Form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/api/client";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "client" as Role,
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register(form);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const body = err.body as Record<string, unknown>;
        const flat: Record<string, string> = {};
        Object.entries(body).forEach(([key, value]) => {
          flat[key] = Array.isArray(value) ? String(value[0]) : String(value);
        });
        setErrors(flat);
      } else {
        setErrors({ detail: "Something went wrong. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Create an account</h1>
        <p className="text-sm text-steel">Join ServiceLink as a client or a service provider.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select
            id="role"
            label="I am a…"
            value={form.role}
            onChange={(e) => update("role", e.target.value as Role)}
          >
            <option value="client">Client — looking to hire a fundi</option>
            <option value="provider">Service provider — a fundi looking for work</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="first_name"
              label="First name"
              required
              value={form.first_name}
              onChange={(e) => update("first_name", e.target.value)}
              error={errors.first_name}
            />
            <Input
              id="last_name"
              label="Last name"
              required
              value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              error={errors.last_name}
            />
          </div>

          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />

          <Input
            id="phone_number"
            label="Phone number"
            type="tel"
            placeholder="+2547XXXXXXXX"
            required
            value={form.phone_number}
            onChange={(e) => update("phone_number", e.target.value)}
            error={errors.phone_number}
            hint="Used for M-Pesa payments and booking notifications."
          />

          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
          />

          <Input
            id="password_confirm"
            label="Confirm password"
            type="password"
            required
            value={form.password_confirm}
            onChange={(e) => update("password_confirm", e.target.value)}
            error={errors.password_confirm}
          />

          {errors.detail && <p className="text-sm font-medium text-danger">{errors.detail}</p>}

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-steel">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-amber-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
