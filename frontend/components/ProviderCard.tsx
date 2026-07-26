import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { TrustStamp } from "@/components/ui/TrustStamp";
import type { FundiProfileListItem } from "@/lib/types";

export function ProviderCard({ provider }: { provider: FundiProfileListItem }) {
  return (
    <Link href={`/providers/${provider.id}`}>
      <Card className="flex h-full flex-col gap-3 transition-shadow hover:shadow-[0_4px_14px_rgba(33,31,27,0.1)]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-ink">{provider.full_name}</h3>
          <TrustStamp status={provider.verification_status} size="sm" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {provider.categories.map((cat) => (
            <span key={cat.id} className="rounded bg-paper px-2 py-0.5 text-xs font-medium text-ink-soft">
              {cat.name}
            </span>
          ))}
        </div>

        {provider.coverage_areas.length > 0 && (
          <p className="text-sm text-steel">{provider.coverage_areas.join(", ")}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <div className="flex items-center gap-2">
            <StarRating rating={Number(provider.average_rating)} size="sm" />
            <span className="text-steel">({provider.completed_jobs_count} jobs)</span>
          </div>
          {!provider.is_available && <span className="text-xs font-semibold text-danger">Unavailable</span>}
        </div>
      </Card>
    </Link>
  );
}
