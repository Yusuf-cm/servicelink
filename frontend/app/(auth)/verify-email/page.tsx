"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Form";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { verifyEmail } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await verifyEmail(email, code);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Invalid code." : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Verify your email</h1>
        <p className="text-sm text-steel">
          Enter the 6-digit code we sent to your email address. (In development, check the backend server
          console — the code is printed there.)
        </p>
      </div>

      <Card>
        {success ? (
          <p className="text-sm font-medium text-verified">Email verified. Redirecting to log in…</p>
        ) : (
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
              id="code"
              label="Verification code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" disabled={submitting} className="mt-2">
              {submitting ? "Verifying…" : "Verify email"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
