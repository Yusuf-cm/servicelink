"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { getMyProfile, updateMyProfile, getCategories, uploadPortfolioImage } from "@/lib/api/providers";
import { ApiRequestError } from "@/lib/api/client";
import type { FundiProfileDetail, ServiceCategory } from "@/lib/types";

function ProfileEditor() {
  const [profile, setProfile] = useState<FundiProfileDetail | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [form, setForm] = useState({
    bio: "",
    coverage_areas: "",
    years_of_experience: 0,
    is_available: true,
    category_ids: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getMyProfile(), getCategories()]).then(([p, cats]) => {
      setProfile(p);
      setCategories(cats);
      setForm({
        bio: p.bio,
        coverage_areas: p.coverage_areas.join(", "),
        years_of_experience: p.years_of_experience,
        is_available: p.is_available,
        category_ids: p.categories.map((c) => c.id),
      });
    });
  }, []);

  function toggleCategory(id: number) {
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(id) ? f.category_ids.filter((c) => c !== id) : [...f.category_ids, id],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await updateMyProfile({
        bio: form.bio,
        coverage_areas: form.coverage_areas.split(",").map((a) => a.trim()).filter(Boolean),
        years_of_experience: form.years_of_experience,
        is_available: form.is_available,
        category_ids: form.category_ids,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Couldn't save changes." : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <p className="text-steel">Loading profile…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Textarea
            id="bio"
            label="About you"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell clients about your experience and specialties."
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-soft">Service categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = form.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-amber text-ink" : "bg-paper text-ink-soft hover:bg-paper-line"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            id="coverage_areas"
            label="Coverage areas"
            hint="Comma-separated, e.g. Westlands, Parklands, Kilimani"
            value={form.coverage_areas}
            onChange={(e) => setForm((f) => ({ ...f, coverage_areas: e.target.value }))}
          />

          <Input
            id="years"
            label="Years of experience"
            type="number"
            min={0}
            value={form.years_of_experience}
            onChange={(e) => setForm((f) => ({ ...f, years_of_experience: Number(e.target.value) }))}
          />

          <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
              className="h-4 w-4 accent-amber"
            />
            Currently accepting new requests
          </label>

          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          {saved && <p className="text-sm font-medium text-verified">Saved.</p>}

          <Button type="submit" disabled={saving} className="self-start">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Card>

      <PortfolioUploader existingCount={profile.portfolio_images.length} />
    </div>
  );
}

function PortfolioUploader({ existingCount }: { existingCount: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(existingCount);
  const [error, setError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadPortfolioImage(file, caption);
      setFile(null);
      setCaption("");
      setUploadedCount((c) => c + 1);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.detail || "Upload failed." : "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 font-display text-lg font-bold text-ink">Portfolio ({uploadedCount} images)</h2>
      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-soft"
        />
        <Input
          id="caption"
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Full bathroom re-plumb, Kilimani"
        />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" disabled={!file || uploading} size="sm" className="self-start">
          {uploading ? "Uploading…" : "Upload image"}
        </Button>
      </form>
    </Card>
  );
}

export default function ProviderProfilePage() {
  return (
    <RequireAuth role="provider">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-8 font-display text-2xl font-bold text-ink">Edit your profile</h1>
        <ProfileEditor />
      </div>
    </RequireAuth>
  );
}
