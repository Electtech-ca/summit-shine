# Summit Shine Car Wash & Detail Co.

A full-stack car wash and detailing booking platform for British Columbia, built with Next.js (App Router), PostgreSQL, Prisma, NextAuth, and Stripe.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui (Base UI primitives)
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth.js (Auth.js v5) — credentials + Google OAuth, role-based (CUSTOMER, STAFF, ADMIN)
- **Payments:** Stripe — Payment Intents, SetupIntents, Subscriptions, webhooks, refunds
- **Email:** Resend
- **Validation:** Zod
- **State/data:** React Server Components + TanStack Query for client mutations
- **Testing:** Vitest (pricing engine and slot-availability engine are pure functions with full unit test coverage)

## Prerequisites

- Node.js 20+
- pnpm
- A PostgreSQL database (a local Docker container works fine for development)
- A [Stripe](https://dashboard.stripe.com) account in **test mode**
- A [Resend](https://resend.com) account (optional in development — the app degrades gracefully with clear error messages if unset)
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook forwarding

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start a local Postgres instance** (skip if you already have one)

   ```bash
   docker run -d --name summit-shine-db \
     -e POSTGRES_USER=summit \
     -e POSTGRES_PASSWORD=summit \
     -e POSTGRES_DB=summit_shine \
     -p 5434:5432 \
     postgres:16-alpine
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Postgres connection string |
   | `NEXTAUTH_SECRET` | Random secret for session encryption — generate with `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `http://localhost:3000` in development |
   | `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | From your Stripe test-mode dashboard |
   | `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (see step 6) |
   | `RESEND_API_KEY` | From your Resend dashboard (optional in dev) |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional — omit to disable Google sign-in |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in development |

4. **Run migrations and seed the database**

   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

   This seeds all services, products, membership plans, business hours, BC statutory holidays for the current and next year, a demo `WELCOME10` discount code, sample testimonials/FAQs, and an admin account:

   - **Email:** `admin@summitshine.ca`
   - **Password:** `SummitShine2026!`

5. **Start the dev server**

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

6. **Forward Stripe webhooks** (in a separate terminal, for payments/subscriptions/refunds to update local records)

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the dev server.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run the Vitest suite (pricing + availability engines) |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Regenerate the Prisma client |

## Project Structure

- `app/` — pages and API routes (App Router)
- `app/admin/` — the admin panel (role-gated: ADMIN/STAFF only)
- `app/api/admin/` — admin-only API routes
- `app/api/webhooks/stripe/` — Stripe webhook handler (source of truth for payment/subscription state)
- `app/api/cron/` — endpoints meant to be hit by a scheduler (see below)
- `lib/pricing.ts`, `lib/availability.ts` — pure calculators with full test coverage in the adjacent `.test.ts` files
- `lib/*.ts` — Stripe, Resend, and discount-resolution helpers, each with a lazy client so the app doesn't crash at build/import time when a third-party API key isn't configured yet
- `components/admin/`, `components/booking/`, `components/cart/`, `components/stripe/` — feature-grouped client components
- `prisma/schema.prisma`, `prisma/seed.ts` — schema and seed data

## Scheduled jobs

Two routes are meant to be triggered periodically by a scheduler (e.g. [Vercel Cron](https://vercel.com/docs/cron-jobs)) — they are not wired to run automatically in this repo:

- `GET /api/cron/reminders` — hourly; emails customers whose booking starts in ~24h.
- `GET /api/cron/recurring-bookings` — daily; generates the next occurrence for each active recurring booking series.

Both accept an optional `Authorization: Bearer <CRON_SECRET>` header if you set a `CRON_SECRET` environment variable.

## Deployment

Target: Vercel (app) + a managed Postgres provider (Neon, Supabase, RDS, etc.). Set the same environment variables as above in your hosting provider, point `STRIPE_WEBHOOK_SECRET` at a webhook endpoint registered in the **live** Stripe dashboard once you're out of test mode, and set `NEXT_PUBLIC_SITE_URL`/`NEXTAUTH_URL` to your production domain.

## For the business owner

See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for a non-technical walkthrough of the admin panel.
