import clsx from "clsx";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-lg border border-paper-line bg-paper-raised p-5 shadow-card", className)}
      {...props}
    />
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-light text-amber-dark",
  pending_payment: "bg-amber-light text-amber-dark",
  accepted: "bg-verified-light text-verified-dark",
  confirmed: "bg-verified-light text-verified-dark",
  in_progress: "bg-amber-light text-amber-dark",
  completed: "bg-verified-light text-verified-dark",
  declined: "bg-danger-light text-danger",
  cancelled: "bg-danger-light text-danger",
  failed: "bg-danger-light text-danger",
  paid: "bg-verified-light text-verified-dark",
  unpaid: "bg-paper-line text-ink-soft",
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? "bg-paper-line text-ink-soft";
  return (
    <span className={clsx("inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize", colorClass)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
