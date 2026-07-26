"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/providers");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.body.detail || "Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>
        <p className="text-sm text-steel">Welcome back to ServiceLink.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-steel">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-amber-dark">
          Register
        </Link>
      </p>
    </div>
  );
}
