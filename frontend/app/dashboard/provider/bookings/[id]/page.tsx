"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBooking, updateBookingStatus } from "@/lib/api/bookings";
import { ApiRequestError } from "@/lib/api/client";
import type { Booking } from "@/lib/types";

function BookingDetail({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const b = await getBooking(bookingId);
    setBooking(b);
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdate(status: "in_progress" | "completed") {
    setUpdating(true);
    setError("");
    try {
      await updateBookingStatus(bookingId, status);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Couldn't update status." : "Something went wrong.");
    } finally {
      setUpdating(false);
    }
  }

  if (!booking) return <p className="text-steel">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{booking.client.full_name}</h1>
          <p className="text-sm text-steel">{booking.service_request.category.name}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.payment_status} />
        </div>
      </div>

      <Card>
        <p className="mb-2 text-sm text-ink-soft">{booking.service_request.description}</p>
        <p className="text-sm text-steel">
          {booking.service_request.location} · Scheduled {booking.scheduled_date} · KES{" "}
          <span className="font-mono">{booking.agreed_price_kes}</span>
        </p>
      </Card>

      {booking.payment_status !== "paid" && (
        <Card className="border-amber bg-amber-light">
          <p className="text-sm font-medium text-amber-dark">Waiting for the client to complete M-Pesa payment.</p>
        </Card>
      )}

      {booking.payment_status === "paid" && booking.status === "confirmed" && (
        <Button onClick={() => handleUpdate("in_progress")} disabled={updating} className="self-start">
          Mark as in progress
        </Button>
      )}

      {booking.payment_status === "paid" && booking.status === "in_progress" && (
        <Button onClick={() => handleUpdate("completed")} disabled={updating} className="self-start">
          Mark as completed
        </Button>
      )}

      {booking.status === "completed" && (
        <Card className="border-verified bg-verified-light">
          <p className="text-sm font-medium text-verified-dark">
            Job completed. {booking.has_review ? "The client has left a review." : "Waiting for the client's review."}
          </p>
        </Card>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

export default function ProviderBookingPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireAuth role="provider">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <BookingDetail bookingId={id} />
      </div>
    </RequireAuth>
  );
}
