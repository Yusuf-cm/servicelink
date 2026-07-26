"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  const dashboardHref = user?.role === "provider" ? "/dashboard/provider" : "/dashboard/client";

  return (
    <header className="border-b border-paper-line bg-paper-raised">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
          Service<span className="text-amber-dark">Link</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
          <Link href="/providers" className="hover:text-ink">
            Find a fundi
          </Link>
          {user && (
            <Link href={dashboardHref} className="hover:text-ink">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-steel sm:inline">{user.first_name}</span>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
