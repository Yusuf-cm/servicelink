"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, StatusBadge } from "@/components/ui/Card";
import { TrustStamp } from "@/components/ui/TrustStamp";
import { listServiceRequests, listBookings } from "@/lib/api/bookings";
import type { ServiceRequest, Booking } from "@/lib/types";

function ClientDashboardContent() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listServiceRequests(), listBookings()])
      .then(([r, b]) => {
        setRequests(r.results);
        setBookings(b.results);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-steel">Loading your dashboard…</p>;

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">Your bookings</h2>
          <Link href="/providers" className="text-sm font-semibold text-amber-dark">
            Find another fundi →
          </Link>
        </div>
        {bookings.length === 0 ? (
          <Card>
            <p className="text-sm text-steel">
              No bookings yet. Once a provider accepts your request, it&apos;ll show up here.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/dashboard/client/requests/${booking.service_request.id}`}>
                <Card className="flex items-center justify-between gap-4 hover:shadow-[0_4px_14px_rgba(33,31,27,0.1)]">
                  <div>
                    <p className="font-semibold text-ink">{booking.provider.full_name}</p>
                    <p className="text-sm text-steel">
                      {booking.service_request.category.name} · KES {booking.agreed_price_kes} ·{" "}
                      {booking.scheduled_date}
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

      <section>
        <h2 className="mb-4 font-display text-xl font-bold text-ink">Pending requests</h2>
        {pendingRequests.length === 0 ? (
          <Card>
            <p className="text-sm text-steel">No pending requests.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <Link key={request.id} href={`/dashboard/client/requests/${request.id}`}>
                <Card className="flex items-center justify-between gap-4 hover:shadow-[0_4px_14px_rgba(33,31,27,0.1)]">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold text-ink">{request.provider.full_name}</p>
                      <TrustStamp status={request.provider.verification_status} size="sm" />
                    </div>
                    <p className="text-sm text-steel">
                      {request.category.name} · {request.location} · {request.preferred_date}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <RequireAuth role="client">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 font-display text-2xl font-bold text-ink">Your dashboard</h1>
        <ClientDashboardContent />
      </div>
    </RequireAuth>
  );
}
