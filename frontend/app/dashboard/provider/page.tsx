"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { TrustStamp } from "@/components/ui/TrustStamp";
import { listServiceRequests, decideServiceRequest, listBookings } from "@/lib/api/bookings";
import { getMyProfile } from "@/lib/api/providers";
import { ApiRequestError } from "@/lib/api/client";
import type { ServiceRequest, Booking, FundiProfileDetail } from "@/lib/types";

function ProviderOverview() {
  const [profile, setProfile] = useState<FundiProfileDetail | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [p, r, b] = await Promise.all([getMyProfile(), listServiceRequests(), listBookings()]);
    setProfile(p);
    setRequests(r.results);
    setBookings(b.results);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading || !profile) return <p className="text-steel">Loading your dashboard…</p>;

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Trust score</p>
          <p className="font-display text-3xl font-bold text-ink">{profile.trust_score}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Jobs completed</p>
          <p className="font-display text-3xl font-bold text-ink">{profile.completed_jobs_count}</p>
        </Card>
        <Card className="flex flex-col justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-steel">Verification</p>
          <TrustStamp status={profile.verification_status} />
        </Card>
      </section>

      {profile.verification_status === "unsubmitted" && (
        <Card className="border-amber bg-amber-light">
          <p className="mb-2 text-sm font-semibold text-amber-dark">
            Submit your NCA or EPRA credentials to get verified and start showing up higher in search.
          </p>
          <Link href="/dashboard/provider/verification">
            <Button size="sm">Submit credentials</Button>
          </Link>
        </Card>
      )}

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Incoming requests</h2>
        {pending.length === 0 ? (
          <Card>
            <p className="text-sm text-steel">No new requests right now.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((request) => (
              <IncomingRequestCard key={request.id} request={request} onDecided={load} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Active bookings</h2>
        {bookings.length === 0 ? (
          <Card>
            <p className="text-sm text-steel">No bookings yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/dashboard/provider/bookings/${booking.id}`}>
                <Card className="flex items-center justify-between gap-4 hover:shadow-[0_4px_14px_rgba(33,31,27,0.1)]">
                  <div>
                    <p className="font-semibold text-ink">{booking.client.full_name}</p>
                    <p className="text-sm text-steel">
                      {booking.service_request.category.name} · KES {booking.agreed_price_kes}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={booking.status} />
                    <StatusBadge status={booking.payment_status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function IncomingRequestCard({ request, onDecided }: { request: ServiceRequest; onDecided: () => void }) {
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(request.preferred_date);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function decide(decision: "accept" | "decline") {
    setSubmitting(true);
    setError("");
    try {
      if (decision === "decline") {
        await decideServiceRequest(request.id, { decision: "decline" });
      } else {
        await decideServiceRequest(request.id, {
          decision: "accept",
          agreed_price_kes: price,
          scheduled_date: date,
        });
      }
      onDecided();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Couldn't update the request." : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold text-ink">{request.client.full_name}</p>
        <span className="text-xs text-steel">{request.category.name}</span>
      </div>
      <p className="mb-3 text-sm text-ink-soft">{request.description}</p>
      <p className="mb-3 text-sm text-steel">
        {request.location} · Preferred date: {request.preferred_date}
      </p>

      {!showAcceptForm ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAcceptForm(true)}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => decide("decline")} disabled={submitting}>
            Decline
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-t border-paper-line pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Input id={`price-${request.id}`} label="Price (KES)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <Input id={`date-${request.id}`} label="Scheduled date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button size="sm" onClick={() => decide("accept")} disabled={submitting || !price}>
            {submitting ? "Confirming…" : "Confirm acceptance"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function ProviderDashboardPage() {
  return (
    <RequireAuth role="provider">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-ink">Your dashboard</h1>
          <Link href="/dashboard/provider/profile" className="text-sm font-semibold text-amber-dark">
            Edit profile →
          </Link>
        </div>
        <ProviderOverview />
      </div>
    </RequireAuth>
  );
}
