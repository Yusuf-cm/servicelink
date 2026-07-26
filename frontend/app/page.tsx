import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TrustStamp } from "@/components/ui/TrustStamp";

const CATEGORIES = [
  { name: "Plumbing", icon: "🔧" },
  { name: "Electrical", icon: "⚡" },
  { name: "Carpentry", icon: "🪚" },
  { name: "Masonry", icon: "🧱" },
  { name: "Painting", icon: "🖌️" },
  { name: "Cleaning", icon: "🧹" },
  { name: "General repairs", icon: "🛠️" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-paper-line bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:grid-cols-2 sm:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-steel">Nairobi County</p>
            <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Find a fundi you don&apos;t have to gamble on.
            </h1>
            <p className="mt-4 max-w-md text-base text-ink-soft">
              ServiceLink checks NCA and EPRA credentials before a plumber, electrician, or mason ever reaches
              your door — then lets past clients tell you the rest.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/providers">
                <Button size="lg">Find a fundi</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="ghost">
                  Register as a fundi
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature stamp visual */}
          <div className="flex justify-center sm:justify-end">
            <div className="rotate-2 rounded-lg border border-paper-line bg-paper-raised p-6 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-6">
                <div>
                  <p className="font-display text-lg font-bold text-ink">James Mwangi</p>
                  <p className="text-sm text-steel">Electrical · Westlands, Parklands</p>
                </div>
                <TrustStamp status="verified" />
              </div>
              <div className="flex items-center gap-2 font-mono text-sm text-ink-soft">
                <span className="text-amber-dark">★★★★★</span>
                <span>4.9 · 62 jobs completed</span>
              </div>
              <div className="mt-4 rounded border border-dashed border-paper-line p-3 font-mono text-xs text-steel">
                EPRA credential verified — active registration confirmed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-6 font-display text-2xl font-bold text-ink">Browse by trade</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/providers?category=${encodeURIComponent(cat.name.toLowerCase())}`}
              className="flex items-center gap-3 rounded-lg border border-paper-line bg-paper-raised p-4 transition-colors hover:border-amber"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-medium text-ink-soft">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust mechanism */}
      <section className="border-t border-paper-line bg-paper-raised">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-8 font-display text-2xl font-bold text-ink">How the trust check works</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-dark">Step one</p>
              <h3 className="mb-2 text-lg font-bold text-ink">Credential verification</h3>
              <p className="text-sm text-ink-soft">
                Providers submit their National Construction Authority or Energy and Petroleum Regulatory
                Authority registration number. An administrator checks it against official records before a
                provider is marked verified.
              </p>
            </div>
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-verified">Step two</p>
              <h3 className="mb-2 text-lg font-bold text-ink">Verified client reviews</h3>
              <p className="text-sm text-ink-soft">
                Only clients who paid for and completed a job can leave a review — one per booking. Ratings
                combine with credential status into a single trust score.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
