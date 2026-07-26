import clsx from "clsx";
import type { VerificationStatus } from "@/lib/types";

const CONFIG: Record<VerificationStatus, { label: string; className: string; show: boolean }> = {
  verified: { label: "Verified", className: "border-verified text-verified bg-verified-light", show: true },
  pending: { label: "Review pending", className: "border-amber text-amber-dark bg-amber-light", show: true },
  rejected: { label: "Not verified", className: "border-danger text-danger bg-danger-light", show: true },
  unsubmitted: { label: "Unverified", className: "border-steel-light text-steel bg-paper", show: false },
};

/**
 * A rotated stamp, like a permit or credential seal — the recurring
 * visual signature for ServiceLink's core differentiator (the dual
 * trust mechanism). Used on provider cards, profiles, and dashboards.
 */
export function TrustStamp({ status, size = "md" }: { status: VerificationStatus; size?: "sm" | "md" }) {
  const config = CONFIG[status];

  return (
    <span
      className={clsx(
        "inline-flex -rotate-3 items-center gap-1 rounded border-2 font-display font-bold uppercase tracking-wide shadow-stamp",
        config.className,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}
