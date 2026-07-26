# ServiceLink Frontend

Next.js 14 (App Router) frontend for ServiceLink, wired against the
Django backend in `servicelink-backend/`.

## Stack

- Next.js 14, TypeScript, Tailwind CSS
- Auth: JWT access token held in memory (React context) only; refresh
  token in an httpOnly cookie set by this app's own `/api/auth/*` route
  handlers, which proxy to Django — matches proposal 3.6's security
  design (access token never touches localStorage)
- No client-side state library — plain `fetch` wrapped in `lib/api/`

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_URL if your Django backend isn't on localhost:8000

# 3. Run the dev server (make sure the Django backend is running first)
npm run dev
```

Open http://localhost:3000.

## Design direction

A Nairobi hardware-store / workshop palette rather than a generic SaaS
look: cement paper background (`#EDEAE1`), ironwork charcoal text
(`#211F1B`), a hardhat-amber for actions (`#E2932A`), and M-Pesa green
(`#1F7A43`) reserved specifically for payment/verified states. Display
type is Space Grotesk, body is IBM Plex Sans, data/prices/credential
numbers use IBM Plex Mono. The recurring signature element is the
rotated "trust stamp" badge (`components/ui/TrustStamp.tsx`) — it's
the visual expression of the product's actual differentiator, the dual
trust mechanism.

## Structure

```
app/
  page.tsx                        Landing page
  (auth)/login, register, verify-email
  providers/                      Search + provider detail + request form
  dashboard/client/                Client bookings, requests, messaging, payment, reviews
  dashboard/provider/              Provider overview, profile editor, verification, booking mgmt
  api/auth/                        Route handlers that proxy to Django and manage the refresh cookie
lib/
  api/                             One module per backend app (auth, providers, bookings, reviews, payments, verification)
  types.ts                         Mirrors the Django REST serializers exactly
context/AuthContext.tsx            Session bootstrap, login/register/logout
components/                        Navbar, Footer, ProviderCard, RequireAuth guard, ui/ primitives
```

## Auth flow

1. `POST /api/auth/login` (our route handler) → calls Django
   `/api/auth/login/` → sets `refresh_token` as an httpOnly cookie →
   returns `{ access, user }` to the browser.
2. `access` token is kept in a module-level JS variable
   (`lib/api/token-store.ts`) — lost on page refresh by design.
3. On every page load, `AuthContext` calls `/api/auth/refresh` (reads
   the httpOnly cookie) to silently re-establish the session.
4. `lib/api/client.ts`'s `apiRequest` attaches `Authorization: Bearer
   <access>` to every Django call, and on a 401 automatically retries
   once after refreshing.

## Known gaps / next steps

- No automated tests yet.
- Portfolio images and provider photos render as plain `<img>` tags,
  not `next/image` — fine for a diploma project, worth revisiting for
  production.
- The M-Pesa payment UI polls `/payments/mpesa/status/` every 3
  seconds while a transaction is pending — works but a websocket/push
  approach would be nicer.
- No pagination UI yet for provider search results beyond the first
  page (backend paginates at 20/page).
