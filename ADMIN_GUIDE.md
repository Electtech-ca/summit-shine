# Summit Shine Admin Guide

A plain-language walkthrough of the admin panel at `/admin`. You'll need to sign in with an account that has the **Admin** or **Staff** role — ask whoever set up the site for access, or use the seeded demo login (`admin@summitshine.ca` / `SummitShine2026!`) if you're still in development.

Everything in this panel updates the live site immediately — there's no separate "publish" step, and no code changes or developer involvement are needed for day-to-day content and pricing changes.

## Dashboard

The first thing you see when you sign in. At a glance:

- **Today's Bookings** and a timeline of what's scheduled today
- **Revenue** for the last 30 days, as a chart
- **Active Members** count
- **Low Stock Items** — products at or below their reorder threshold
- Recent orders and upcoming appointments

## Bookings & Schedule

- **All Bookings** — every booking, with its reference number, customer, services, total, status, and payment status.
- Click **Manage** on any booking to see full details and:
  - Change its **status** (Pending → Confirmed → In Progress → Completed, or Cancelled / No-show)
  - Change its **payment status**
  - **Refund** a paid booking — this actually issues the refund through Stripe, not just a local note
- **Walk-in Quick Add** — for a customer who shows up without booking online. Pick their services and vehicle size, optionally mark it paid, and it's added to the schedule immediately as Confirmed.

## Services

Full control over every wash and detailing service: name, category, description, image, duration, price, an optional sale price (shows as a strikethrough + "Sale" badge on the site), per-vehicle-size price add-ons (Sedan/SUV/Truck/Oversized), and whether it's Active and/or Featured on the homepage.

Deleting a service doesn't actually delete it — it's deactivated so it disappears from the public site but past bookings that reference it stay intact.

## Products & Inventory

Same idea as Services, for retail items (towels, air fresheners, gift cards, etc.): name, description, image, price, sale price, SKU, stock quantity, and a low-stock threshold that feeds the Dashboard's low-stock alert.

## Memberships

- Edit the three plan tiers (Evergreen/Glacier/Summit) — name, description, monthly price, perks list, and the automatic detailing discount percentage members get.
  - **Changing the price** creates a new Stripe price behind the scenes and retires the old one — existing members keep their current price until they resubscribe; this is standard Stripe behavior and avoids surprise mid-cycle changes.
- **Members list** — see who's subscribed and cancel a membership on a customer's behalf if needed.

## Discounts

Create coupon codes (customer types a code at checkout) or automatic promotions (no code — applies automatically when a cart matches, e.g. "20% off details in December"). For each:

- Percentage or fixed-dollar amount
- Optional minimum spend
- Optional start/end dates
- Optional usage limits (total, and/or per customer)

## Customers

Every customer account, their membership status, and lifetime spend. Click into one to see their saved vehicles and full booking history. **Export CSV** downloads the list for use elsewhere (email marketing, spreadsheets, etc.).

## Orders & Payments

A log of retail product orders and booking payments that have gone through Stripe — useful for reconciling what's actually been collected.

## Content / CMS

Everything about the public site's content, editable without touching code:

- **Testimonials** — approve or unapprove submitted reviews before they show on the homepage; delete spam.
- **FAQ** — add or remove questions and answers shown on the `/faq` page.
- **Business Hours** — set open/close time per day of the week, or mark a day fully closed. This directly controls what times customers can book.
- **Holiday / Blackout Dates** — block specific dates (statutory holidays, etc.) from being booked at all, regardless of your normal hours.

## Settings

- **Business Name** — changes everywhere it appears on the site (header, footer, page titles) instantly.
- **GST / PST** — tax rates applied to every booking and order.
- **Booking Rules** — how far ahead customers can book, how much lead time is required for a same-day booking, how many vehicles/bays can be served at once, buffer time between appointments, deposit percentage, and the cancellation window (how many hours before an appointment a customer can cancel without penalty).
- **Feature Flags** — turn "pay at location" on/off, and a placeholder for SMS reminders (needs a Twilio account connected by a developer before it can actually send texts).

## Staff

Admins only. Promote an existing customer account to Staff or Admin by email, or add a brand-new staff account before they've ever signed up (they'll be able to sign in with Google using that email, or set a password once "forgot password" email is configured). Remove someone's staff/admin access with one click — you can't remove your own.

## Audit Log

A running record of who changed what and when — every price change, discount edit, refund, status change, and staff permission change is logged here. Useful for accountability and for tracking down "wait, who changed this?"

---

## Things that need a developer, not this panel

- Connecting real Stripe **live-mode** keys when you're ready to accept real payments (this repo ships with test-mode keys only)
- Connecting Resend so booking confirmations, receipts, and reminders actually get emailed
- Connecting Twilio if you want the SMS reminders flag to do anything
- Scheduling the two background jobs (`/api/cron/reminders` and `/api/cron/recurring-bookings`) to run automatically — see the main README
