import { PrismaClient, VehicleSize } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Vehicle-size price modifiers, in cents, applied on top of a service's base
// (sedan) price — see CLAUDE.md §4.2.
const SIZE_DELTAS: Record<VehicleSize, number> = {
  SEDAN: 0,
  SUV: 1000,
  TRUCK: 1500,
  OVERSIZED: 2500,
};

const UNSPLASH = (query: string) =>
  `https://images.unsplash.com/${query}?auto=format&fit=crop&w=1600&q=80`;

async function seedCategoriesAndServices() {
  const categories = [
    { name: "Exterior Washes", slug: "exterior-washes", sortOrder: 0 },
    { name: "Interior", slug: "interior", sortOrder: 1 },
    { name: "Detailing", slug: "detailing", sortOrder: 2 },
    { name: "Fleet", slug: "fleet", sortOrder: 3 },
  ];

  const categoryBySlug: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
    categoryBySlug[c.slug] = row.id;
  }

  type SeedService = {
    categorySlug: string;
    name: string;
    slug: string;
    description: string;
    durationMin: number;
    basePriceCents: number;
    featured?: boolean;
    sortOrder: number;
    images: string[];
    /** Services quoted individually (Fleet) skip size modifiers. */
    noSizeModifiers?: boolean;
  };

  const services: SeedService[] = [
    {
      categorySlug: "exterior-washes",
      name: "Express Exterior",
      slug: "express-exterior",
      description:
        "A quick, thorough exterior rinse and hand-dry — perfect for keeping your ride shining like a BC morning between full washes.",
      durationMin: 15,
      basePriceCents: 1299,
      featured: true,
      sortOrder: 0,
      images: [UNSPLASH("photo-1520340356584-f9917d1eea6f")],
    },
    {
      categorySlug: "exterior-washes",
      name: "Deluxe Wash",
      slug: "deluxe-wash",
      description:
        "Our Express wash plus a deep wheel clean and tire shine so every angle gleams.",
      durationMin: 25,
      basePriceCents: 1999,
      featured: true,
      sortOrder: 1,
      images: [UNSPLASH("photo-1607860108855-64acf2078ed9")],
    },
    {
      categorySlug: "exterior-washes",
      name: "Ultimate Wash",
      slug: "ultimate-wash",
      description:
        "The full works: hand wax, undercarriage flush, and rain repellent treatment for BC's wettest roads.",
      durationMin: 35,
      basePriceCents: 2999,
      featured: true,
      sortOrder: 2,
      images: [UNSPLASH("photo-1552519507-da3b142c6e3d")],
    },
    {
      categorySlug: "interior",
      name: "Interior Vacuum & Wipe-Down",
      slug: "interior-vacuum-wipe-down",
      description:
        "Full cabin vacuum, dash and console wipe-down, window cleaning inside and out.",
      durationMin: 30,
      basePriceCents: 3499,
      sortOrder: 0,
      images: [UNSPLASH("photo-1552353617-3bfe6e08c1b7")],
    },
    {
      categorySlug: "interior",
      name: "Full Interior Detail",
      slug: "full-interior-detail",
      description:
        "Deep shampoo, leather conditioning, and odor treatment for a like-new cabin.",
      durationMin: 120,
      basePriceCents: 14999,
      featured: true,
      sortOrder: 1,
      images: [UNSPLASH("photo-1605515298946-d0573716b1c1")],
    },
    {
      categorySlug: "detailing",
      name: "Hand Wax & Polish",
      slug: "hand-wax-polish",
      description: "Hand-applied wax and polish for deep gloss and paint protection.",
      durationMin: 90,
      basePriceCents: 8999,
      sortOrder: 0,
      images: [UNSPLASH("photo-1519641471654-76ce0107ad1b")],
    },
    {
      categorySlug: "detailing",
      name: "Clay Bar Treatment",
      slug: "clay-bar-treatment",
      description: "Removes bonded contaminants for a glass-smooth finish before wax or coating.",
      durationMin: 100,
      basePriceCents: 11999,
      sortOrder: 1,
      images: [UNSPLASH("photo-1601362840469-51e4d8d58785")],
    },
    {
      categorySlug: "detailing",
      name: "Ceramic Coating",
      slug: "ceramic-coating",
      description:
        "Multi-year ceramic paint protection — pricing from, final quote depends on vehicle condition.",
      durationMin: 240,
      basePriceCents: 49900,
      featured: true,
      sortOrder: 2,
      images: [UNSPLASH("photo-1616455579100-2ceaa4eb2d37")],
    },
    {
      categorySlug: "detailing",
      name: "Headlight Restoration",
      slug: "headlight-restoration",
      description: "Restores clarity to foggy, yellowed headlight lenses.",
      durationMin: 45,
      basePriceCents: 6999,
      sortOrder: 3,
      images: [UNSPLASH("photo-1503376780353-7e6692767b70")],
    },
    {
      categorySlug: "detailing",
      name: "Engine Bay Cleaning",
      slug: "engine-bay-cleaning",
      description: "Safe degreasing and detailing of the engine bay.",
      durationMin: 40,
      basePriceCents: 5999,
      sortOrder: 4,
      images: [UNSPLASH("photo-1493238792000-8113da705763")],
    },
    {
      categorySlug: "detailing",
      name: "Pet Hair Removal",
      slug: "pet-hair-removal",
      description: "Specialized tools to lift embedded pet hair from carpets and upholstery. Add-on.",
      durationMin: 30,
      basePriceCents: 3999,
      sortOrder: 5,
      images: [UNSPLASH("photo-1601758228041-f3b2795255f1")],
    },
    {
      categorySlug: "detailing",
      name: "Winter Salt & Undercarriage Package",
      slug: "winter-salt-undercarriage-package",
      description: "A BC-winter essential — flushes road salt and grime from the undercarriage to fight corrosion.",
      durationMin: 25,
      basePriceCents: 4499,
      sortOrder: 6,
      images: [UNSPLASH("photo-1483721310020-03333e577078")],
    },
    {
      categorySlug: "fleet",
      name: "Fleet / Commercial",
      slug: "fleet-commercial",
      description: "Custom per-vehicle rates for commercial fleets. Contact us for a quote.",
      durationMin: 30,
      basePriceCents: 0,
      sortOrder: 0,
      images: [UNSPLASH("photo-1601362840469-51e4d8d58785")],
      noSizeModifiers: true,
    },
  ];

  for (const s of services) {
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        categoryId: categoryBySlug[s.categorySlug],
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        basePriceCents: s.basePriceCents,
        featured: !!s.featured,
        sortOrder: s.sortOrder,
        images: s.images,
        active: true,
      },
      create: {
        categoryId: categoryBySlug[s.categorySlug],
        name: s.name,
        slug: s.slug,
        description: s.description,
        durationMin: s.durationMin,
        basePriceCents: s.basePriceCents,
        featured: !!s.featured,
        sortOrder: s.sortOrder,
        images: s.images,
      },
    });

    if (!s.noSizeModifiers) {
      for (const [size, delta] of Object.entries(SIZE_DELTAS) as [VehicleSize, number][]) {
        await prisma.sizeModifier.upsert({
          where: { serviceId_size: { serviceId: service.id, size } },
          update: { deltaCents: delta },
          create: { serviceId: service.id, size, deltaCents: delta },
        });
      }
    }
  }
}

async function seedProducts() {
  const products = [
    {
      name: "Microfibre Towel Pack (6-pack)",
      slug: "microfibre-towel-pack",
      description: "Six premium microfibre towels for streak-free drying and detailing.",
      priceCents: 2499,
      stockQty: 60,
      images: [UNSPLASH("photo-1583947581924-860bda6a26df")],
    },
    {
      name: "Air Freshener — Cedar & Pine",
      slug: "air-freshener-cedar-pine",
      description: "A BC-forest scented air freshener — cedar and pine.",
      priceCents: 699,
      stockQty: 120,
      images: [UNSPLASH("photo-1518127249613-14b888fb610e")],
    },
    {
      name: "Spray Wax",
      slug: "spray-wax",
      description: "Quick-detail spray wax for a fast shine boost between washes.",
      priceCents: 1899,
      stockQty: 80,
      images: [UNSPLASH("photo-1615397349754-cfa2066a298e")],
    },
    {
      name: "Interior Cleaner",
      slug: "interior-cleaner",
      description: "All-purpose interior cleaner safe for dash, vinyl, and plastic trim.",
      priceCents: 1699,
      stockQty: 80,
      images: [UNSPLASH("photo-1600861194942-f883de0dfe96")],
    },
    {
      name: "Tire Shine",
      slug: "tire-shine",
      description: "Long-lasting tire shine for a showroom look.",
      priceCents: 1499,
      stockQty: 90,
      images: [UNSPLASH("photo-1553440569-bcc63803a83d")],
    },
    {
      name: "Wash Mitt",
      slug: "wash-mitt",
      description: "Ultra-soft microfibre wash mitt, safe for all paint types.",
      priceCents: 1299,
      stockQty: 100,
      images: [UNSPLASH("photo-1605164599901-91c0d3b3b6dc")],
    },
    {
      name: "Gift Card — $25",
      slug: "gift-card-25",
      description: "Summit Shine gift card, $25 CAD.",
      priceCents: 2500,
      stockQty: 9999,
      images: [UNSPLASH("photo-1607344645866-009c320b63e0")],
    },
    {
      name: "Gift Card — $50",
      slug: "gift-card-50",
      description: "Summit Shine gift card, $50 CAD.",
      priceCents: 5000,
      stockQty: 9999,
      images: [UNSPLASH("photo-1607344645866-009c320b63e0")],
    },
    {
      name: "Gift Card — $100",
      slug: "gift-card-100",
      description: "Summit Shine gift card, $100 CAD.",
      priceCents: 10000,
      stockQty: 9999,
      images: [UNSPLASH("photo-1607344645866-009c320b63e0")],
    },
    {
      name: "Summit Shine Branded Cap",
      slug: "branded-cap",
      description: "Embroidered Summit Shine cap.",
      priceCents: 2999,
      stockQty: 50,
      images: [UNSPLASH("photo-1521369909029-2afed882baee")],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
}

async function seedMembershipPlans() {
  const plans = [
    {
      name: "Evergreen",
      description: "Unlimited Express washes, any time.",
      priceCents: 2999,
      perks: ["Unlimited Express Exterior washes", "Priority lane"],
      detailDiscountPct: 0,
    },
    {
      name: "Glacier",
      description: "Unlimited Deluxe washes plus a discount on detailing.",
      priceCents: 4999,
      perks: ["Unlimited Deluxe washes", "10% off all detailing services", "Priority lane"],
      detailDiscountPct: 10,
    },
    {
      name: "Summit",
      description: "Unlimited Ultimate washes, a bigger detailing discount, and free vacuums.",
      priceCents: 7999,
      perks: [
        "Unlimited Ultimate washes",
        "15% off all detailing services",
        "2 free interior vacuums / month",
        "Priority lane",
      ],
      detailDiscountPct: 15,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.membershipPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.membershipPlan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.membershipPlan.create({ data: plan });
    }
  }
}

async function seedBusinessHours() {
  // dayOfWeek: 0 = Sunday ... 6 = Saturday
  const hours = [
    { dayOfWeek: 0, openTime: "09:00", closeTime: "17:00", closed: false },
    { dayOfWeek: 1, openTime: "08:00", closeTime: "19:00", closed: false },
    { dayOfWeek: 2, openTime: "08:00", closeTime: "19:00", closed: false },
    { dayOfWeek: 3, openTime: "08:00", closeTime: "19:00", closed: false },
    { dayOfWeek: 4, openTime: "08:00", closeTime: "19:00", closed: false },
    { dayOfWeek: 5, openTime: "08:00", closeTime: "19:00", closed: false },
    { dayOfWeek: 6, openTime: "08:00", closeTime: "19:00", closed: false },
  ];

  for (const h of hours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: h.dayOfWeek },
      update: h,
      create: h,
    });
  }
}

async function seedBlackoutDates() {
  // BC statutory holidays — current year (2026) and next (2027).
  const holidays: { date: string; reason: string }[] = [
    { date: "2026-01-01", reason: "New Year's Day" },
    { date: "2026-02-16", reason: "Family Day" },
    { date: "2026-04-03", reason: "Good Friday" },
    { date: "2026-05-18", reason: "Victoria Day" },
    { date: "2026-07-01", reason: "Canada Day" },
    { date: "2026-08-03", reason: "BC Day" },
    { date: "2026-09-07", reason: "Labour Day" },
    { date: "2026-09-30", reason: "National Day for Truth and Reconciliation" },
    { date: "2026-10-12", reason: "Thanksgiving" },
    { date: "2026-11-11", reason: "Remembrance Day" },
    { date: "2026-12-25", reason: "Christmas Day" },
    { date: "2027-01-01", reason: "New Year's Day" },
    { date: "2027-02-15", reason: "Family Day" },
    { date: "2027-03-26", reason: "Good Friday" },
    { date: "2027-05-24", reason: "Victoria Day" },
    { date: "2027-07-01", reason: "Canada Day" },
    { date: "2027-08-02", reason: "BC Day" },
    { date: "2027-09-06", reason: "Labour Day" },
    { date: "2027-09-30", reason: "National Day for Truth and Reconciliation" },
    { date: "2027-10-11", reason: "Thanksgiving" },
    { date: "2027-11-11", reason: "Remembrance Day" },
    { date: "2027-12-25", reason: "Christmas Day" },
  ];

  for (const h of holidays) {
    await prisma.blackoutDate.upsert({
      where: { date: new Date(h.date) },
      update: { reason: h.reason },
      create: { date: new Date(h.date), reason: h.reason },
    });
  }
}

async function seedAdminUser() {
  const passwordHash = await bcrypt.hash("SummitShine2026!", 10);
  await prisma.user.upsert({
    where: { email: "admin@summitshine.ca" },
    update: { role: "ADMIN", passwordHash },
    create: {
      name: "Summit Shine Admin",
      email: "admin@summitshine.ca",
      passwordHash,
      role: "ADMIN",
    },
  });
}

async function seedTestimonials() {
  const testimonials = [
    {
      author: "Priya S., North Vancouver",
      body: "The Ultimate Wash left my SUV looking better than the day I bought it. The rain repellent is a game changer for our winters.",
      rating: 5,
      approved: true,
    },
    {
      author: "Mark T., Kelowna",
      body: "Signed up for the Glacier membership and it's paid for itself twice over. Staff are friendly and fast.",
      rating: 5,
      approved: true,
    },
    {
      author: "Aiden R., Victoria",
      body: "Ceramic coating job was flawless. Pricey but worth it for a coastal car.",
      rating: 5,
      approved: true,
    },
    {
      author: "Jasleen K., Surrey",
      body: "Booked online in two minutes and got a same-day slot. Super convenient.",
      rating: 4,
      approved: true,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { author: t.author } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }
}

async function seedFaqs() {
  const faqs = [
    {
      question: "What areas of British Columbia do you serve?",
      answer:
        "Our flagship location and booking system currently serve the Lower Mainland, with more locations coming soon.",
      sortOrder: 0,
    },
    {
      question: "Do I need to book in advance?",
      answer:
        "Walk-ins are welcome for exterior washes, but booking ahead guarantees your slot — especially on weekends.",
      sortOrder: 1,
    },
    {
      question: "How does the membership work?",
      answer:
        "Choose a tier, add a card on file, and get unlimited washes at that tier plus detailing discounts. Pause or cancel any time from your account.",
      sortOrder: 2,
    },
    {
      question: "What's your cancellation policy?",
      answer:
        "Cancel or reschedule up to 24 hours before your appointment at no charge. Late cancellations may forfeit any deposit paid.",
      sortOrder: 3,
    },
    {
      question: "Do you offer eco-friendly washing?",
      answer:
        "Yes — our wash bays use water reclamation systems and biodegradable soaps to minimize environmental impact.",
      sortOrder: 4,
    },
  ];

  for (const f of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (existing) {
      await prisma.faq.update({ where: { id: existing.id }, data: f });
    } else {
      await prisma.faq.create({ data: f });
    }
  }
}

async function seedDiscount() {
  await prisma.discount.upsert({
    where: { code: "WELCOME10" },
    update: {
      name: "Welcome — 10% Off",
      type: "PERCENTAGE",
      valuePct: 10,
      active: true,
    },
    create: {
      code: "WELCOME10",
      name: "Welcome — 10% Off",
      type: "PERCENTAGE",
      valuePct: 10,
      usesPerCustomer: 1,
      stackable: false,
      active: true,
    },
  });
}

async function seedSiteSettings() {
  const settings: { key: string; value: unknown }[] = [
    { key: "businessName", value: "Summit Shine Car Wash & Detail Co." },
    { key: "gstPct", value: 5 },
    { key: "pstPct", value: 7 },
    { key: "currency", value: "CAD" },
    { key: "bookingLeadTimeMin", value: 60 },
    { key: "maxAdvanceBookingDays", value: 60 },
    { key: "slotCapacity", value: 2 },
    { key: "bufferMinutes", value: 10 },
    { key: "depositPct", value: 20 },
    { key: "cancellationWindowHours", value: 24 },
    { key: "payAtLocationEnabled", value: true },
    { key: "smsRemindersEnabled", value: false },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as never },
      create: { key: s.key, value: s.value as never },
    });
  }
}

async function main() {
  console.log("Seeding categories & services...");
  await seedCategoriesAndServices();
  console.log("Seeding products...");
  await seedProducts();
  console.log("Seeding membership plans...");
  await seedMembershipPlans();
  console.log("Seeding business hours...");
  await seedBusinessHours();
  console.log("Seeding BC statutory holiday blackout dates...");
  await seedBlackoutDates();
  console.log("Seeding admin user...");
  await seedAdminUser();
  console.log("Seeding testimonials...");
  await seedTestimonials();
  console.log("Seeding FAQs...");
  await seedFaqs();
  console.log("Seeding WELCOME10 discount...");
  await seedDiscount();
  console.log("Seeding site settings...");
  await seedSiteSettings();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
