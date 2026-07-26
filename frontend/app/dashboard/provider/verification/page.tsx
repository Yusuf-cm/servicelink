"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { submitCredential } from "@/lib/api/verification";
import { ApiRequestError } from "@/lib/api/client";

function VerificationForm() {
  const [body, setBody] = useState<"nca" | "epra">("nca");
  const [number, setNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await submitCredential({ credential_body: body, credential_number: number });
      setResult(res.detail);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Submission failed." : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      {result ? (
        <p className="text-sm font-medium text-verified">{result}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select id="body" label="Regulatory body" value={body} onChange={(e) => setBody(e.target.value as "nca" | "epra")}>
            <option value="nca">National Construction Authority (NCA)</option>
            <option value="epra">Energy and Petroleum Regulatory Authority (EPRA)</option>
          </Select>
          <Input
            id="number"
            label="Registration number"
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. NCA/12345/2023"
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for verification"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function VerificationPage() {
  return (
    <RequireAuth role="provider">
      <div className="mx-auto max-w-lg px-6 py-10">
        <h1 className="mb-2 font-display text-2xl font-bold text-ink">Credential verification</h1>
        <p className="mb-6 text-sm text-steel">
          Submit your NCA or EPRA registration number. An administrator reviews it before your profile shows the
          verified badge — this usually takes 1–2 business days.
        </p>
        <VerificationForm />
      </div>
    </RequireAuth>
  );
}
