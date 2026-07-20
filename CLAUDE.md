# CLAUDE.md — Summit Shine Car Wash & Detail Co.
## Full-Stack Website Build Specification (British Columbia, Canada)

This file is the master build specification for Claude Code. Follow it top-to-bottom. Every feature described here is in scope. Build incrementally, commit often, and keep the admin panel and public site in the same monorepo.

---

## 1. Project Overview

Build a production-grade website + booking platform + admin CMS for a modern car wash and detailing business located in British Columbia, Canada.

**Brand personality:** Premium, clean, distinctly Canadian. The visual identity should evoke BC's landscape — snow-capped Coast Mountains, evergreen forests, glacial lakes, Pacific coastline — paired with sleek, modern car wash imagery (foam cannons, LED-lit wash tunnels, gleaming vehicles).

**Working name:** Summit Shine Car Wash & Detail Co. (make the name configurable in admin settings so the owner can rebrand without code changes).

---

## 2. Tech Stack (required)

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | **PostgreSQL** |
| ORM | Prisma |
| Auth | NextAuth.js (Auth.js) — credentials + Google OAuth; role-based (CUSTOMER, STAFF, ADMIN) |
| Payments | **Stripe** — Checkout, Payment Intents, saved cards (SetupIntents), Subscriptions for memberships, Webhooks |
| Email | Resend (or Nodemailer fallback) — booking confirmations, receipts, reminders |
| Image handling | next/image with remote patterns; admin uploads via UploadThing or local `/public/uploads` in dev |
| Validation | Zod on every API route and form |
| State/data | React Server Components + TanStack Query for client mutations |
| Deployment target | Vercel (site) + Neon/Supabase/RDS (Postgres) — use `DATABASE_URL` env var |

Environment variables to scaffold in `.env.example`:

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=
```

---

## 3. Design Direction

### 3.1 Visual language
- **Hero imagery:** full-bleed photography/video blending BC scenery with modern car wash scenes. Use royalty-free sources (Unsplash/Pexels) with search themes: "British Columbia mountains", "Vancouver skyline", "Whistler forest road", "car wash foam", "detailing studio", "wet asphalt reflections". Store hero images as admin-editable records so the owner can swap them.
- **Palette:**
  - Glacier Blue `#7FB3D5` / Deep Pacific `#0B3C5D`
  - Evergreen `#1E5631`
  - Snow White `#F8FAFC`
  - Cedar accent `#B45309`
  - Charcoal text `#1F2937`
- **Typography:** Display — "Outfit" or "Sora"; Body — "Inter". Large, confident headlines; generous whitespace.
- **Motifs:** subtle mountain-ridge SVG dividers between sections; water-droplet micro-animations; maple leaf accent used sparingly (footer, favicon).
- Fully responsive (mobile-first), dark-mode optional toggle, WCAG 2.1 AA contrast, `prefers-reduced-motion` respected.

### 3.2 Tone of copy
Friendly, proudly local: "Shine like a BC morning." Prices in **CAD**, taxes noted as **GST 5% + PST 7%** (both configurable in admin — never hardcode tax rates).

---

## 4. Public Site — Pages & Features

### 4.1 Home `/`
- Hero with rotating BC-themed imagery, headline, primary CTA ("Book a Wash") and secondary CTA ("View Memberships").
- Featured services grid (pulled from DB, admin-controlled "featured" flag).
- Membership teaser with monthly pricing.
- "Why Summit Shine" — eco-friendly water reclamation, spot-free rinse, hand-finish, etc.
- Live "Today's Hours & Wash Status" bar (open/closed, current wait estimate — admin-toggleable).
- Google Maps embed for location; testimonials carousel (DB-driven, admin-moderated); gift card promo; newsletter signup.

### 4.2 Services & Products `/services`
All content DB-driven. Two catalog types:

**A. Wash & Detail Services** (typical standard establishment — seed all of these):

| Category | Service | Seed Price (CAD) |
|---|---|---|
| Exterior Washes | Express Exterior | $12.99 |
| | Deluxe Wash (wheels + tire shine) | $19.99 |
| | Ultimate Wash (wax + undercarriage + rain repellent) | $29.99 |
| Interior | Interior Vacuum & Wipe-Down | $34.99 |
| | Full Interior Detail (shampoo, leather condition, odor treatment) | $149.99 |
| Detailing | Hand Wax & Polish | $89.99 |
| | Clay Bar Treatment | $119.99 |
| | Ceramic Coating (from) | $499.00 |
| | Headlight Restoration | $69.99 |
| | Engine Bay Cleaning | $59.99 |
| | Pet Hair Removal add-on | $39.99 |
| | Winter Salt & Undercarriage Package (BC winters!) | $44.99 |
| Fleet | Fleet/Commercial per-vehicle rate | Quote |

Vehicle-size price modifiers: Sedan (base), SUV/Crossover (+$10), Truck/Van (+$15), Oversized (+$25) — modifiers stored in DB, editable in admin.

**B. Retail Products** (purchasable online for pickup, Stripe checkout):
- Microfibre towel packs, air fresheners (Cedar & Pine — BC theme), spray wax, interior cleaner, tire shine, wash mitts, gift cards ($25/$50/$100 + custom amount), branded merch.

Each service/product page shows: image gallery, description, duration, base price, size modifiers, active discount badge, "Book Now" / "Add to Cart".

### 4.3 Memberships `/memberships`
Stripe **Subscriptions**. Seed three tiers (admin-editable):
- **Evergreen** — $29.99/mo — unlimited Express washes
- **Glacier** — $49.99/mo — unlimited Deluxe + 10% off detailing
- **Summit** — $79.99/mo — unlimited Ultimate + 15% off detailing + 2 free interior vacuums/mo

Members get: saved credit cards on file (Stripe SetupIntent → saved PaymentMethod), member pricing auto-applied at booking, license-plate fast lane field, pause/cancel self-serve from account portal (use Stripe Billing Portal).

### 4.4 Booking `/book` — Booking, Pre-scheduling & Scheduling
This is the core page. Multi-step wizard:

1. **Choose service(s)** → running total updates live (with size modifier + tax + any discount).
2. **Choose vehicle** (saved vehicles for logged-in users: make, model, colour, plate, size class).
3. **Choose date & time** — calendar with real availability:
   - Slot engine: business hours, per-slot capacity (number of bays/staff), service duration blocking, buffer time, blackout dates/holidays (BC stat holidays seeded), all admin-configurable.
   - **Pre-scheduling:** allow booking up to N days ahead (admin setting, default 60) and **recurring bookings** (weekly/bi-weekly/monthly — e.g., fleet or commuter clients) stored as a recurrence rule that auto-generates future appointments.
   - Same-day "next available" quick option.
4. **Details & extras** — add-ons checklist, notes field, promo/discount code input (validated server-side).
5. **Payment** — Stripe: pay in full now, pay deposit (admin-configurable %, default 20%), or "pay at location" (admin can disable). Members with card on file get one-click confirm.
6. **Confirmation** — booking reference, email confirmation with `.ics` calendar attachment, SMS-ready hook (stub Twilio integration behind a feature flag).

Customer self-serve: reschedule/cancel from `/account/bookings` with an admin-configurable cancellation window (default 24h; late cancel may forfeit deposit — configurable).

### 4.5 Other public pages
- `/about` — story, team, eco commitment (water reclamation stats)
- `/gallery` — before/after slider component, admin-uploadable
- `/gift-cards` — buy via Stripe, code emailed, redeemable at checkout/booking
- `/contact` — form (stored in DB + emailed), map, hours
- `/faq` — accordion, DB-driven
- `/careers` — job posts, DB-driven, simple apply form
- `/legal/privacy`, `/legal/terms` — note PIPEDA (Canadian privacy) compliance language
- `/account` — profile, vehicles, bookings, membership, saved cards (via Stripe), order history, receipts

---

## 5. Discounts & Promotions Engine
Full capacity for discounting, all admin-managed:
- **Coupon codes:** percentage or fixed amount; scoped to specific services, categories, products, or order total; min spend; usage limits (total + per customer); date window; stackable flag (default non-stackable).
- **Automatic promotions:** e.g., "Winter Special — 20% off Ultimate Wash, Dec–Feb", "Tuesday Senior Discount 15%", "First wash 50% off for new accounts". Applied automatically at checkout when conditions match.
- **Member discounts:** tier-based percentages defined on the membership plan.
- **Sale price field** on any service/product (strikethrough original price on the site with a badge).
- Sync discounts to Stripe Coupons/Promotion Codes where payment goes through Stripe; always re-validate server-side — never trust client-side totals.

---

## 6. Admin Interface `/admin` (very friendly, everything editable)
Protected by ADMIN/STAFF roles. Clean sidebar layout (shadcn/ui). **Every offering, service, product, price, and most site features must be editable here — no code deploys needed for content changes.**

Modules:

1. **Dashboard** — today's bookings timeline, revenue (day/week/month charts via Recharts), membership count, upcoming appointments, recent orders, low-stock alerts.
2. **Bookings & Schedule** — calendar view (day/week), drag-to-reschedule, status workflow (Pending → Confirmed → In Progress → Completed / No-show / Cancelled), walk-in quick-add, mark paid, refund via Stripe from the booking detail page.
3. **Services** — full CRUD: name, slug, category, description (rich text), images, duration, base price, size modifiers, active/featured toggles, sort order. Instant preview.
4. **Products & Inventory** — CRUD, stock quantity, low-stock threshold, SKU.
5. **Memberships** — edit tiers, pricing (syncs to Stripe Prices — create new Price, archive old), perks list, member list with status, manual comp/cancel.
6. **Discounts** — create/edit coupons and automatic promotions as in §5; usage analytics per code.
7. **Customers** — searchable list, profile with vehicles, booking history, lifetime spend, notes; export CSV.
8. **Orders & Payments** — Stripe payment log mirrored locally via webhooks; issue refunds; view payouts summary.
9. **Content/CMS** — edit hero images & headlines, homepage sections, testimonials (approve/reject), FAQ, gallery, careers posts, business hours, holiday closures, announcement banner.
10. **Settings** — business name/logo, address, tax rates (GST/PST), currency, booking rules (lead time, max advance days, slot capacity, buffer, deposit %, cancellation window), feature flags (pay-at-location, SMS, dark mode), Stripe mode indicator (test/live).
11. **Staff** — invite staff accounts, assign roles, per-staff schedule/availability (used by the slot engine when capacity = staff-based).
12. **Audit log** — record who changed what, when (prices, discounts, refunds especially).

UX requirements for admin: inline editing where sensible, optimistic updates, toasts, confirm dialogs on destructive actions, autosave drafts on long forms, mobile-usable.

---

## 7. PostgreSQL Database — Prisma Schema
Implement this schema (adjust field details as needed, keep entities and relations):

```prisma
enum Role { CUSTOMER STAFF ADMIN }
enum VehicleSize { SEDAN SUV TRUCK OVERSIZED }
enum BookingStatus { PENDING CONFIRMED IN_PROGRESS COMPLETED CANCELLED NO_SHOW }
enum PaymentStatus { UNPAID DEPOSIT_PAID PAID REFUNDED PARTIALLY_REFUNDED }
enum DiscountType { PERCENTAGE FIXED }
enum OrderStatus { PENDING PAID FULFILLED CANCELLED REFUNDED }

model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  passwordHash  String?
  role          Role     @default(CUSTOMER)
  phone         String?
  stripeCustomerId String? @unique
  vehicles      Vehicle[]
  bookings      Booking[]
  orders        Order[]
  membership    Membership?
  createdAt     DateTime @default(now())
}

model Vehicle {
  id      String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  make    String
  model   String
  colour  String?
  plate   String?
  size    VehicleSize @default(SEDAN)
}

model ServiceCategory {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  sortOrder Int      @default(0)
  services Service[]
}

model Service {
  id          String  @id @default(cuid())
  categoryId  String
  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  name        String
  slug        String  @unique
  description String
  images      String[]
  durationMin Int
  basePriceCents Int
  salePriceCents Int?
  active      Boolean @default(true)
  featured    Boolean @default(false)
  sortOrder   Int     @default(0)
  sizeModifiers SizeModifier[]
  bookingItems BookingItem[]
}

model SizeModifier {
  id        String @id @default(cuid())
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id])
  size      VehicleSize
  deltaCents Int
  @@unique([serviceId, size])
}

model Product {
  id          String  @id @default(cuid())
  name        String
  slug        String  @unique
  description String
  images      String[]
  priceCents  Int
  salePriceCents Int?
  sku         String? @unique
  stockQty    Int     @default(0)
  lowStockAt  Int     @default(5)
  active      Boolean @default(true)
  orderItems  OrderItem[]
}

model MembershipPlan {
  id            String @id @default(cuid())
  name          String
  description   String
  priceCents    Int
  interval      String  @default("month")
  perks         String[]
  detailDiscountPct Int @default(0)
  stripeProductId String?
  stripePriceId  String?
  active        Boolean @default(true)
  members       Membership[]
}

model Membership {
  id        String @id @default(cuid())
  userId    String @unique
  user      User   @relation(fields: [userId], references: [id])
  planId    String
  plan      MembershipPlan @relation(fields: [planId], references: [id])
  stripeSubscriptionId String? @unique
  status    String  // active, past_due, canceled, paused
  startedAt DateTime @default(now())
  currentPeriodEnd DateTime?
}

model Booking {
  id          String @id @default(cuid())
  reference   String @unique          // e.g. SS-2026-000123
  userId      String?
  user        User?  @relation(fields: [userId], references: [id])
  guestName   String?
  guestEmail  String?
  guestPhone  String?
  vehicleId   String?
  startsAt    DateTime
  endsAt      DateTime
  status      BookingStatus @default(PENDING)
  paymentStatus PaymentStatus @default(UNPAID)
  subtotalCents Int
  discountCents Int @default(0)
  taxCents    Int
  totalCents  Int
  depositCents Int @default(0)
  discountId  String?
  discount    Discount? @relation(fields: [discountId], references: [id])
  stripePaymentIntentId String?
  notes       String?
  recurrenceId String?
  recurrence  RecurringBooking? @relation(fields: [recurrenceId], references: [id])
  items       BookingItem[]
  createdAt   DateTime @default(now())
  @@index([startsAt])
}

model BookingItem {
  id        String @id @default(cuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id])
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id])
  priceCents Int    // snapshot at time of booking
  sizeDeltaCents Int @default(0)
}

model RecurringBooking {
  id        String @id @default(cuid())
  userId    String
  frequency String   // WEEKLY, BIWEEKLY, MONTHLY
  dayOfWeek Int?
  timeOfDay String
  active    Boolean @default(true)
  bookings  Booking[]
}

model Discount {
  id          String @id @default(cuid())
  code        String? @unique         // null => automatic promotion
  name        String
  type        DiscountType
  valuePct    Int?
  valueCents  Int?
  minSpendCents Int?
  appliesToServiceIds String[]
  appliesToProductIds String[]
  startsAt    DateTime?
  endsAt      DateTime?
  maxUses     Int?
  usesPerCustomer Int?
  usedCount   Int @default(0)
  stackable   Boolean @default(false)
  active      Boolean @default(true)
  stripeCouponId String?
  bookings    Booking[]
  orders      Order[]
}

model Order {
  id         String @id @default(cuid())
  userId     String?
  user       User?  @relation(fields: [userId], references: [id])
  status     OrderStatus @default(PENDING)
  subtotalCents Int
  discountCents Int @default(0)
  taxCents   Int
  totalCents Int
  discountId String?
  discount   Discount? @relation(fields: [discountId], references: [id])
  stripePaymentIntentId String?
  items      OrderItem[]
  createdAt  DateTime @default(now())
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  qty       Int
  priceCents Int   // snapshot
}

model GiftCard {
  id          String @id @default(cuid())
  code        String @unique
  initialCents Int
  balanceCents Int
  purchaserEmail String?
  active      Boolean @default(true)
  expiresAt   DateTime?
}

model BusinessHours {
  id        String @id @default(cuid())
  dayOfWeek Int    @unique  // 0-6
  openTime  String?
  closeTime String?
  closed    Boolean @default(false)
}

model BlackoutDate {
  id    String @id @default(cuid())
  date  DateTime @unique
  reason String?
}

model SiteSetting {
  key   String @id
  value Json
}

model ContentBlock {          // hero images, homepage sections, banner
  id    String @id @default(cuid())
  key   String @unique
  data  Json
}

model Testimonial {
  id       String @id @default(cuid())
  author   String
  body     String
  rating   Int
  approved Boolean @default(false)
  createdAt DateTime @default(now())
}

model Faq {
  id       String @id @default(cuid())
  question String
  answer   String
  sortOrder Int @default(0)
  active   Boolean @default(true)
}

model AuditLog {
  id        String @id @default(cuid())
  userId    String
  action    String
  entity    String
  entityId  String?
  before    Json?
  after     Json?
  createdAt DateTime @default(now())
}
```

Store all money as **integer cents**. Tax rates live in `SiteSetting` (`gstPct: 5`, `pstPct: 7`). Write a `prisma/seed.ts` that seeds all services, products, plans, hours (Mon–Sat 8:00–19:00, Sun 9:00–17:00), BC stat holidays for the current + next year, an admin user, sample testimonials, FAQs, and one demo discount code `WELCOME10`.

---

## 8. Stripe Integration Requirements
- Bookings & product orders: Stripe **Payment Intents** (embedded Payment Element) — supports credit cards, Apple Pay, Google Pay.
- Memberships: Stripe **Subscriptions** + **Billing Portal** for self-serve card updates/cancellation.
- Saved cards for members/clients: **SetupIntents**; display saved cards (brand + last4) in account; charge saved card for one-click booking.
- Gift cards: standard Payment Intent purchase; redemption handled internally against `GiftCard.balanceCents` before Stripe charges the remainder.
- **Webhooks** (`/api/webhooks/stripe`): handle `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, refund events. Webhook updates local Booking/Order/Membership records — the DB is the source of truth for the admin panel.
- Refunds initiated from admin call Stripe Refund API then update local records + audit log.
- Currency: CAD everywhere. Verify webhook signatures. Never trust client-side amounts — compute totals server-side from DB prices.

---

## 9. Additional Required Features
- **SEO:** metadata per page, OpenGraph images, sitemap.xml, robots.txt, LocalBusiness JSON-LD (with BC address, hours, geo).
- **Performance:** image optimization, lazy loading, route-level loading states, Lighthouse 90+ targets.
- **Accessibility:** semantic HTML, keyboard navigable booking wizard, aria labels, focus management in dialogs.
- **Security:** rate limiting on auth/booking/contact endpoints, CSRF-safe mutations, input validation with Zod, role checks in middleware for `/admin`, hashed passwords (bcrypt), HTTPS-only cookies.
- **Emails:** booking confirmation (+ .ics), reminder 24h before (cron route or scheduled function), receipt, membership welcome, gift card delivery, cancellation notice.
- **Error handling:** friendly error pages, Sentry-ready error boundaries (behind env flag).
- **Testing:** unit tests for the pricing/discount calculator and slot-availability engine (Vitest) — these two modules must be pure functions with full test coverage.
- **Docs:** README with setup steps (`pnpm install`, `prisma migrate dev`, `prisma db seed`, Stripe CLI webhook forwarding), and an ADMIN_GUIDE.md written for a non-technical owner.

---

## 10. Build Order (do it in this sequence)
1. Scaffold Next.js + Tailwind + shadcn/ui + Prisma; write schema; migrate; seed.
2. Auth (NextAuth) with roles; account pages shell.
3. Public pages with DB-driven content (services, products, memberships, FAQ, testimonials).
4. Pricing engine (pure function: items + vehicle size + discounts + tax → totals) with tests.
5. Slot-availability engine with tests; booking wizard end-to-end (no payment yet).
6. Stripe: one-time payments → saved cards → subscriptions → webhooks → refunds.
7. Admin panel modules in the order listed in §6.
8. Discount/promotion engine wired into booking + cart.
9. Emails, gift cards, recurring bookings.
10. SEO, accessibility pass, polish, README + ADMIN_GUIDE.

Deliver a fully working local build using Stripe test mode.
