import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../lib/generated/prisma");
const prisma = new PrismaClient();

const categories = [
  {
    name: "Daily Essentials",
    slug: "daily-essentials",
    description: "Everyday vitamins and minerals for a solid baseline.",
    position: 0,
  },
  {
    name: "Performance",
    slug: "performance",
    description: "Support for training, focus, and recovery.",
    position: 1,
  },
  {
    name: "Sleep & Recovery",
    slug: "sleep-recovery",
    description: "Wind down and recover overnight.",
    position: 2,
  },
];

const collections = [
  {
    name: "Best Sellers",
    slug: "best-sellers",
    description: "The products our customers reorder most.",
    position: 0,
  },
  {
    name: "New Arrivals",
    slug: "new-arrivals",
    description: "Fresh additions to the Vitanou range.",
    position: 1,
  },
];

const products = [
  {
    name: "Daily Multivitamin",
    slug: "daily-multivitamin",
    description:
      "A complete daily multivitamin with 23 essential vitamins and minerals.\n\nTake one capsule with breakfast.",
    status: "ACTIVE",
    featured: true,
    category: "daily-essentials",
    collections: ["best-sellers"],
    seoTitle: "Daily Multivitamin | Vitanou",
    seoDescription:
      "A complete daily multivitamin with 23 essential vitamins and minerals.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
        alt: "Daily Multivitamin bottle",
      },
    ],
    variants: [
      { title: "30 capsules", sku: "VIT-MV-30", price: 2499, stock: 120 },
      { title: "60 capsules", sku: "VIT-MV-60", price: 3999, stock: 80 },
    ],
  },
  {
    name: "Magnesium Complex",
    slug: "magnesium-complex",
    description:
      "Magnesium glycinate and citrate for muscle recovery and calm evenings.\n\nTake two capsules before bed.",
    status: "ACTIVE",
    featured: true,
    category: "sleep-recovery",
    collections: ["best-sellers"],
    seoTitle: "Magnesium Complex | Vitanou",
    seoDescription:
      "Magnesium glycinate and citrate for muscle recovery and calm evenings.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80",
        alt: "Magnesium Complex bottle",
      },
    ],
    variants: [
      { title: "60 capsules", sku: "VIT-MG-60", price: 2199, stock: 150 },
    ],
  },
  {
    name: "Omega-3 Fish Oil",
    slug: "omega-3-fish-oil",
    description:
      "High-strength omega-3 with EPA and DHA for heart, brain, and joint support.\n\nTake one softgel daily.",
    status: "ACTIVE",
    featured: true,
    category: "daily-essentials",
    collections: ["best-sellers", "new-arrivals"],
    seoTitle: "Omega-3 Fish Oil | Vitanou",
    seoDescription:
      "High-strength omega-3 with EPA and DHA for heart, brain, and joint support.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=1200&q=80",
        alt: "Omega-3 Fish Oil bottle",
      },
    ],
    variants: [
      { title: "60 softgels", sku: "VIT-OM-60", price: 2799, stock: 90 },
      { title: "120 softgels", sku: "VIT-OM-120", price: 4499, stock: 60 },
    ],
  },
  {
    name: "Vitamin D3 + K2",
    slug: "vitamin-d3-k2",
    description:
      "Vitamin D3 with K2 for bone health and immune support.\n\nTake one capsule daily with a meal.",
    status: "ACTIVE",
    featured: false,
    category: "daily-essentials",
    collections: ["new-arrivals"],
    seoTitle: "Vitamin D3 + K2 | Vitanou",
    seoDescription:
      "Vitamin D3 with K2 for bone health and immune support.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80",
        alt: "Vitamin D3 + K2 bottle",
      },
    ],
    variants: [
      { title: "90 capsules", sku: "VIT-D3-90", price: 1899, stock: 200 },
    ],
  },
  {
    name: "Pre-Workout",
    slug: "pre-workout",
    description:
      "Clean energy with caffeine, creatine, and beta-alanine.\n\nMix one scoop with water 20 minutes before training.",
    status: "ACTIVE",
    featured: true,
    category: "performance",
    collections: ["new-arrivals"],
    seoTitle: "Pre-Workout | Vitanou",
    seoDescription:
      "Clean energy with caffeine, creatine, and beta-alanine.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80",
        alt: "Pre-Workout tub",
      },
    ],
    variants: [
      { title: "Fruit Punch", sku: "VIT-PW-FP", price: 3499, stock: 70 },
      { title: "Blue Raspberry", sku: "VIT-PW-BR", price: 3499, stock: 70 },
      { title: "Unflavored", sku: "VIT-PW-UF", price: 3299, stock: 50 },
    ],
  },
];

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vitanou.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "admin" },
      });
    }
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: "Store Admin",
      email,
      emailVerified: true,
      role: "admin",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });
  console.log(`Created admin: ${email} / ${password}`);
}

async function seedCatalog() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: collection,
      create: collection,
    });
  }

  const categoryMap = new Map(
    (await prisma.category.findMany()).map((category) => [category.slug, category.id])
  );
  const collectionMap = new Map(
    (await prisma.collection.findMany()).map((collection) => [collection.slug, collection.id])
  );

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    if (existing) continue;

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        featured: product.featured,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        categoryId: categoryMap.get(product.category) ?? null,
        collections: {
          connect: product.collections
            .map((slug) => collectionMap.get(slug))
            .filter(Boolean)
            .map((id) => ({ id })),
        },
        images: {
          create: product.images.map((image, position) => ({
            ...image,
            position,
          })),
        },
        variants: {
          create: product.variants.map((variant, position) => ({
            ...variant,
            position,
          })),
        },
      },
    });
    console.log(`Created product: ${product.name}`);
  }
}

try {
  await seedAdmin();
  await seedCatalog();
  console.log("Seed complete.");
} finally {
  await prisma.$disconnect();
}
