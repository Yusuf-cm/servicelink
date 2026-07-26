"use client";

import clsx from "clsx";

export function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(rating);
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";

  return (
    <span className={clsx("font-mono text-amber-dark", sizeClass)} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-paper-line">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onClick={() => onChange(n)}
          className={clsx(
            "text-3xl leading-none transition-colors",
            n <= value ? "text-amber-dark" : "text-paper-line hover:text-amber-light"
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
