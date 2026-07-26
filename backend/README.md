# ServiceLink Backend

Django REST Framework API for ServiceLink — the digital marketplace
connecting verified trade service providers (fundis) with clients in
Nairobi. Implements Chapter 3 (Methodology & Design) and Chapter 4
(Implementation) of the project proposal.

## Stack

- Django 5 + Django REST Framework
- PostgreSQL
- JWT auth (djangorestframework-simplejwt) — short-lived access token,
  longer-lived refresh token, blacklist on logout
- M-Pesa Daraja API (real integration — STK Push + callback)
- NCA/EPRA credential verification — **mocked** for this phase (see
  `apps/verification/services.py`); admin makes the final call manually
  in the Django admin, per the proposal's scope

## Local setup

```bash
# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# edit .env: set DB credentials, and MPESA_* if you want real STK pushes

# 4. Create the database (adjust to your local Postgres setup)
createdb servicelink

# 5. Run migrations
python manage.py makemigrations
python manage.py migrate

# 6. Seed the seven service categories from the proposal's scope
python manage.py seed_categories

# 7. Create an admin account (for the manual credential-verification workflow)
python manage.py createsuperuser

# 8. Run the dev server
python manage.py runserver
```

API is served at `http://localhost:8000/api/`. Admin panel at
`http://localhost:8000/admin/`.

## App structure

| App            | Responsibility                                                          |
|----------------|---------------------------------------------------------------------------|
| `users`        | Custom email-auth User model, registration, JWT login, OTP email verify  |
| `providers`    | ServiceCategory, FundiProfile (bio, coverage area, trust score, badge)   |
| `verification` | Mocked NCA/EPRA credential check + admin review workflow                 |
| `bookings`     | ServiceRequest → Booking flow, in-app messaging                          |
| `reviews`      | One review per completed booking; recalculates provider trust score     |
| `payments`     | M-Pesa Daraja STK Push, callback handling, transaction status            |

## Key endpoints

```
POST   /api/auth/register/
POST   /api/auth/verify-email/
POST   /api/auth/login/
POST   /api/auth/refresh/
POST   /api/auth/logout/
GET    /api/auth/me/

GET    /api/providers/categories/
GET    /api/providers/?category=electrical&location=Westlands
GET    /api/providers/{id}/
GET    /api/providers/me/           (provider only)
PATCH  /api/providers/me/
POST   /api/providers/me/portfolio/

POST   /api/verification/submit/    (provider submits NCA/EPRA number)
GET    /api/verification/history/

POST   /api/bookings/requests/                    (client creates a request)
POST   /api/bookings/requests/{id}/decision/       (provider accepts/declines)
GET    /api/bookings/requests/{id}/messages/
POST   /api/bookings/requests/{id}/messages/
GET    /api/bookings/
GET    /api/bookings/{id}/
POST   /api/bookings/{id}/status/                  (provider: in_progress/completed)

POST   /api/reviews/                (client reviews a completed booking)
GET    /api/reviews/provider/{provider_id}/

POST   /api/payments/mpesa/initiate/
POST   /api/payments/mpesa/callback/    (Safaricom calls this — public)
GET    /api/payments/mpesa/status/{checkout_request_id}/
```

## M-Pesa sandbox testing

1. Register an app at https://developer.safaricom.co.ke to get a
   Consumer Key/Secret, and use the default sandbox shortcode `174379`
   with the published sandbox passkey.
2. Daraja needs a **public HTTPS** callback URL — use `ngrok http 8000`
   in dev and set `MPESA_CALLBACK_URL` to the ngrok URL +
   `/api/payments/mpesa/callback/`.
3. Sandbox STK pushes only accept Safaricom's test MSISDN
   (`254708374149`) regardless of what number you type in.

## Credential verification (NCA/EPRA)

Neither regulator currently exposes a public verification API, so
`apps/verification/services.py` implements a **mock backend** that
returns a deterministic, realistic-shaped response (active / expired /
not_found) for any registration number, plus three reserved test values
(`NCA/TEST/VALID`, `NCA/TEST/EXPIRED`, `NCA/TEST/NOTFOUND`) for
predictable demos. The mock result is stored as a `VerificationCheck`
for the admin's reference, but — matching the proposal's scope — the
admin makes the final verify/reject decision by hand in
`/admin/providers/fundiprofile/`. Swapping in a real registry later only
requires implementing `LiveVerificationBackend.check()`.

## Tests

Test scaffolding isn't included yet — add `apps/<app>/tests.py` per app
and run with `python manage.py test`. Priority per proposal 4.3/4.4:
authentication module and the booking flow (the two "highest-risk
areas").
