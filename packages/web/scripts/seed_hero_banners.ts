import { readFileSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/api/database/__client";
import * as schema from "../src/api/database/schema";
import { s3 } from "../src/api/lib/s3";

/**
 * Demo hero slides + demo discounts for the marketplace. Idempotent: slides are
 * matched by English title, discounts are simply set. Remove them from /admin/banners.
 * Images: pass converted JPEGs in HERO_IMG_DIR (defaults to /tmp/hero).
 */
const IMG_DIR = process.env.HERO_IMG_DIR ?? "/tmp/hero";

const DISCOUNTS: Record<string, number> = {
  "custom-thermal-mugs": 20,
  "roll-up-banner-printing": 15,
  "indoor-led-display-screen": 10,
};

const SLIDES = [
  {
    image: "gf-002-mugs.jpg",
    product: "custom-thermal-mugs",
    titleEn: "Your brand on every cup",
    titleAr: "شعارك على كل كوب",
    subtitleEn: "Custom thermal mugs with your logo — perfect for gifts and staff.",
    subtitleAr: "أكواب حرارية بشعارك — مثالية للهدايا والموظفين.",
    badgeEn: "Limited offer",
    badgeAr: "عرض لفترة محدودة",
    ctaEn: "Order now",
    ctaAr: "اطلب الآن",
  },
  {
    image: "pr-001-rollup.jpg",
    product: "roll-up-banner-printing",
    titleEn: "Roll-up banners, printed fast",
    titleAr: "رول أب مطبوع بسرعة",
    subtitleEn: "Sharp full-colour print on a portable stand, ready for your next event.",
    subtitleAr: "طباعة ملوّنة عالية الجودة على حامل متنقّل، جاهز لفعاليتك القادمة.",
    badgeEn: "Best seller",
    badgeAr: "الأكثر مبيعاً",
    ctaEn: "See details",
    ctaAr: "عرض التفاصيل",
  },
  {
    image: "eq-002-led.jpg",
    product: "indoor-led-display-screen",
    titleEn: "Make your stand impossible to miss",
    titleAr: "اجعل جناحك لا يُنسى",
    subtitleEn: "Rent indoor LED screens for conferences and exhibitions.",
    subtitleAr: "استأجر شاشات LED داخلية للمؤتمرات والمعارض.",
    badgeEn: "Rental",
    badgeAr: "إيجار",
    ctaEn: "Rent a screen",
    ctaAr: "استأجر شاشة",
  },
  {
    image: "eq-003-booth.jpg",
    product: "exhibition-booth-3x3",
    titleEn: "Exhibition booths, built for you",
    titleAr: "أجنحة معارض مصمّمة لك",
    subtitleEn: "A complete 3x3 booth — design, build and set-up in one place.",
    subtitleAr: "جناح 3×3 متكامل — تصميم وتصنيع وتركيب في مكان واحد.",
    badgeEn: "Request a quote",
    badgeAr: "اطلب عرض سعر",
    ctaEn: "Get a quote",
    ctaAr: "احصل على عرض",
  },
  {
    image: "gf-001-pens.jpg",
    product: "branded-pens-pack",
    titleEn: "Corporate gifts that get remembered",
    titleAr: "هدايا مؤسسية لا تُنسى",
    subtitleEn: "Branded pens, mugs and more — in any quantity.",
    subtitleAr: "أقلام وأكواب وغيرها بشعارك — بأي كمية.",
    badgeEn: "Gifts",
    badgeAr: "هدايا",
    ctaEn: "Browse gifts",
    ctaAr: "تصفّح الهدايا",
  },
] as const;

async function upload(fileName: string) {
  const key = `banners/${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: readFileSync(`${IMG_DIR}/${fileName}`),
      ContentType: "image/jpeg",
      ACL: "public-read",
    }),
  );
  return key;
}

const products = await db.select().from(schema.products).where(inArray(schema.products.slug, [...SLIDES.map((s) => s.product), ...Object.keys(DISCOUNTS)]));
const existing = await db.select().from(schema.marketplaceBanners);

let order = existing.reduce((m, b) => Math.max(m, b.sortOrder), -1) + 1;
for (const slide of SLIDES) {
  const product = products.find((p) => p.slug === slide.product);
  if (!product) {
    console.warn(`skip: product ${slide.product} not found`);
    continue;
  }
  const imageKey = await upload(slide.image);
  const values = {
    titleEn: slide.titleEn,
    titleAr: slide.titleAr,
    subtitleEn: slide.subtitleEn,
    subtitleAr: slide.subtitleAr,
    badgeEn: slide.badgeEn,
    badgeAr: slide.badgeAr,
    ctaEn: slide.ctaEn,
    ctaAr: slide.ctaAr,
    imageKey,
    productId: product.id,
    isActive: true,
  };
  const found = existing.find((b) => b.titleEn === slide.titleEn);
  if (found) {
    await db.update(schema.marketplaceBanners).set(values).where(eq(schema.marketplaceBanners.id, found.id));
    console.log("updated slide:", slide.titleEn);
  } else {
    await db.insert(schema.marketplaceBanners).values({ ...values, sortOrder: order++ });
    console.log("created slide:", slide.titleEn);
  }
}

for (const [slug, pct] of Object.entries(DISCOUNTS)) {
  const product = products.find((p) => p.slug === slug);
  if (!product) continue;
  await db.update(schema.products).set({ discountPercent: pct, discountEndsAt: null }).where(eq(schema.products.id, product.id));
  console.log(`discount ${pct}% on ${slug}`);
}
process.exit(0);
