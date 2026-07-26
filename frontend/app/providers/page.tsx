"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { Select, Input } from "@/components/ui/Form";
import { searchProviders } from "@/lib/api/providers";
import { getCategories } from "@/lib/api/providers";
import type { FundiProfileListItem, ServiceCategory } from "@/lib/types";

function ProviderSearch() {
  const params = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<FundiProfileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const category = params.get("category") ?? "";
  const location = params.get("location") ?? "";

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await searchProviders({ category, location, ordering: "-trust_score" });
      setProviders(results.results);
    } catch {
      setError("Couldn't load providers. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [category, location]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/providers?${next.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Find a verified fundi</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Select
          id="category"
          label="Trade category"
          value={category}
          onChange={(e) => updateParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </Select>

        <Input
          id="location"
          label="Location"
          placeholder="e.g. Westlands"
          defaultValue={location}
          onBlur={(e) => updateParam("location", e.target.value)}
        />
      </div>

      {loading && <p className="text-steel">Loading providers…</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && providers.length === 0 && (
        <p className="text-steel">No providers match your search yet. Try a different category or location.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10 text-steel">Loading…</div>}>
      <ProviderSearch />
    </Suspense>
  );
}
