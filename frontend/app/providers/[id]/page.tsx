"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProvider } from "@/lib/api/providers";
import { getProviderReviews } from "@/lib/api/reviews";
import { createServiceRequest } from "@/lib/api/bookings";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { TrustStamp } from "@/components/ui/TrustStamp";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { Textarea, Input, Select } from "@/components/ui/Form";
import { ApiRequestError } from "@/lib/api/client";
import type { FundiProfileDetail, Review, ServiceCategory } from "@/lib/types";

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [provider, setProvider] = useState<FundiProfileDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    Promise.all([getProvider(id), getProviderReviews(id)])
      .then(([p, r]) => {
        setProvider(p);
        setReviews(r.results);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="mx-auto max-w-4xl px-6 py-10 text-steel">Loading provider…</p>;
  if (!provider) return <p className="mx-auto max-w-4xl px-6 py-10 text-danger">Provider not found.</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{provider.user.full_name}</h1>
          <p className="mt-1 text-steel">{provider.coverage_areas.join(", ") || "Coverage area not set"}</p>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={Number(provider.average_rating)} />
            <span className="text-sm text-steel">
              {provider.average_rating} · {provider.completed_jobs_count} jobs completed
            </span>
          </div>
        </div>
        <TrustStamp status={provider.verification_status} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {provider.categories.map((cat) => (
          <span key={cat.id} className="rounded bg-paper-raised px-3 py-1 text-sm font-medium text-ink-soft">
            {cat.name}
          </span>
        ))}
      </div>

      {provider.bio && (
        <Card className="mb-6">
          <h2 className="mb-2 font-display text-lg font-bold text-ink">About</h2>
          <p className="text-sm text-ink-soft">{provider.bio}</p>
        </Card>
      )}

      {provider.portfolio_images.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Recent work</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {provider.portfolio_images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.image}
                alt={img.caption || "Portfolio image"}
                className="aspect-square rounded object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Request service CTA */}
      {user?.role === "client" && (
        <div className="mb-8">
          {!showRequestForm ? (
            <Button onClick={() => setShowRequestForm(true)}>Request this service</Button>
          ) : (
            <RequestServiceForm providerId={provider.id} categories={provider.categories} />
          )}
        </div>
      )}
      {!user && (
        <Card className="mb-8">
          <p className="text-sm text-ink-soft">
            <button className="font-semibold text-amber-dark" onClick={() => router.push("/login")}>
              Log in
            </button>{" "}
            as a client to request this provider.
          </p>
        </Card>
      )}

      {/* Reviews */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-steel">No reviews yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-ink">{review.client_name}</span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                {review.comment && <p className="text-sm text-ink-soft">{review.comment}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestServiceForm({ providerId, categories }: { providerId: string; categories: ServiceCategory[] }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createServiceRequest({
        provider: providerId,
        category: categoryId,
        description,
        location,
        preferred_date: preferredDate,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/client"), 1200);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Couldn't submit request." : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card>
        <p className="text-sm font-medium text-verified">
          Request sent! The provider will accept or decline it shortly.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {categories.length > 1 && (
          <Select
            id="category"
            label="Which service?"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}
        <Textarea
          id="description"
          label="Describe the job"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Kitchen tap is leaking and the shut-off valve doesn't fully close."
        />
        <Input
          id="location"
          label="Location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Parklands, block C"
        />
        <Input
          id="preferred_date"
          label="Preferred date"
          type="date"
          required
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
        />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </Button>
      </form>
    </Card>
  );
}
