"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { Card, StatusBadge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { StarRatingInput } from "@/components/ui/StarRating";
import { getServiceRequest, listMessages, sendMessage } from "@/lib/api/bookings";
import { initiateMpesaPayment, getMpesaStatus } from "@/lib/api/payments";
import { createReview } from "@/lib/api/reviews";
import { ApiRequestError } from "@/lib/api/client";
import type { ServiceRequest, Booking, Message, MpesaTransaction } from "@/lib/types";

function RequestDetailContent({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await getServiceRequest(requestId);
    setRequest(r);
    const msgs = await listMessages(requestId);
    setMessages(msgs.results);
    setLoading(false);
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !request) return <p className="text-steel">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">{request.provider.full_name}</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-sm text-steel">
          {request.category.name} · {request.location} · Preferred: {request.preferred_date}
        </p>
      </div>

      <Card>
        <p className="text-sm text-ink-soft">{request.description}</p>
      </Card>

      {request.has_booking && <BookingSection requestId={requestId} />}

      <MessageThread requestId={requestId} messages={messages} onSent={load} />
    </div>
  );
}

function BookingSection({ requestId }: { requestId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [phone, setPhone] = useState("");
  const [txn, setTxn] = useState<MpesaTransaction | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    // Bookings are listed for the client; find the one matching this request.
    const { listBookings } = await import("@/lib/api/bookings");
    const all = await listBookings();
    const match = all.results.find((b) => b.service_request.id === requestId) ?? null;
    setBooking(match);
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!txn || txn.status !== "pending") return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const updated = await getMpesaStatus(txn.id);
        setTxn(updated);
        if (updated.status !== "pending") {
          clearInterval(interval);
          setPolling(false);
          load();
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [txn, load]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setError("");
    try {
      const res = await initiateMpesaPayment(booking.id, phone);
      setTxn(res.transaction);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Payment could not be started." : "Something went wrong.");
    }
  }

  if (!booking) return null;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Booking</h2>
        <div className="flex gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.payment_status} />
        </div>
      </div>
      <p className="mb-4 text-sm text-ink-soft">
        Agreed price: <span className="font-mono font-semibold text-ink">KES {booking.agreed_price_kes}</span>
        {" · "}Scheduled: {booking.scheduled_date}
      </p>

      {booking.payment_status === "unpaid" && (
        <form onSubmit={handlePay} className="flex flex-col gap-3 border-t border-paper-line pt-4">
          <Input
            id="phone"
            label="M-Pesa phone number"
            placeholder="0712345678"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          {txn?.status === "pending" ? (
            <p className="text-sm text-amber-dark">
              {polling ? "Check your phone and enter your M-Pesa PIN…" : "Payment pending."}
            </p>
          ) : (
            <Button type="submit">Pay with M-Pesa</Button>
          )}
        </form>
      )}

      {booking.payment_status === "paid" && booking.status === "completed" && !booking.has_review && (
        <ReviewForm bookingId={booking.id} onSubmitted={load} />
      )}
      {booking.has_review && <p className="border-t border-paper-line pt-4 text-sm text-verified">You&apos;ve reviewed this job.</p>}
    </Card>
  );
}

function ReviewForm({ bookingId, onSubmitted }: { bookingId: string; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createReview(bookingId, rating, comment);
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Couldn't submit review." : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-paper-line pt-4">
      <h3 className="font-display font-bold text-ink">Leave a review</h3>
      <StarRatingInput value={rating} onChange={setRating} />
      <Textarea id="comment" label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}

function MessageThread({
  requestId,
  messages,
  onSent,
}: {
  requestId: string;
  messages: Message[];
  onSent: () => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await sendMessage(requestId, body);
      setBody("");
      onSent();
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-bold text-ink">Messages</h2>
      <div className="mb-3 flex flex-col gap-2">
        {messages.length === 0 && <p className="text-sm text-steel">No messages yet — say hello.</p>}
        {messages.map((m) => (
          <Card key={m.id} className="py-2">
            <p className="text-xs font-semibold text-steel">{m.sender_name}</p>
            <p className="text-sm text-ink-soft">{m.body}</p>
          </Card>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 rounded border border-paper-line bg-paper-raised px-3 py-2 text-sm focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          placeholder="Write a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" disabled={sending}>
          Send
        </Button>
      </form>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireAuth role="client">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <RequestDetailContent requestId={id} />
      </div>
    </RequireAuth>
  );
}
