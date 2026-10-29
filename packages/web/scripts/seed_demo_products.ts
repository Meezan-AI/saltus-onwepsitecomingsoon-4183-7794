import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../src/api/database/__client";
import * as schema from "../src/api/database/schema";
import { publicUrl, s3 } from "../src/api/lib/s3";

const IMG_DIR = `${import.meta.dir}/seed-images`;

async function upload(fileName: string, key: string) {
  const body = readFileSync(`${IMG_DIR}/${fileName}`);
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/png",
      ACL: "public-read",
    }),
  );
  return key;
}

type VariantSeed = {
  name: string;
  priceCents: number;
  rentalUnit?: string;
};

type ProductSeed = {
  sku: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: "equipment" | "printing" | "gift" | "service" | "other";
  fulfillmentType: "pickup_rental" | "delivery" | "mixed_per_variant";
  allowDirectPurchase: boolean;
  allowRfq: boolean;
  image: string;
  variants: VariantSeed[];
};

type CategorySeed = {
  slug: string;
  nameEn: string;
  nameAr: string;
  products: ProductSeed[];
};

const SEED: CategorySeed[] = [
  {
    slug: "conference-equipment",
    nameEn: "Conference & Exhibition Equipment",
    nameAr: "معدات المؤتمرات والمعارض",
    products: [
      {
        sku: "EQ-001",
        slug: "mobile-podium-stand",
        nameEn: "Mobile Podium Stand",
        nameAr: "منصة خطابة متنقلة",
        descriptionEn: "Portable lectern in wood finish with built-in mic shelf, ideal for conferences and events.",
        descriptionAr: "منصة خطابة متنقلة بتشطيب خشبي مع رف للميكروفون، مناسبة للمؤتمرات والفعاليات.",
        type: "equipment",
        fulfillmentType: "pickup_rental",
        allowDirectPurchase: false,
        allowRfq: true,
        image: "eq-001-podium.png",
        variants: [{ name: "تأجير يومي", priceCents: 45000, rentalUnit: "day" }],
      },
      {
        sku: "EQ-002",
        slug: "indoor-led-display-screen",
        nameEn: "Indoor LED Display Screen",
        nameAr: "شاشة LED للعرض الداخلي",
        descriptionEn: "High-resolution indoor LED screen on stand, delivered and installed by our technical team.",
        descriptionAr: "شاشة LED داخلية عالية الدقة على حامل، يتم تركيبها وتشغيلها من فريقنا التقني.",
        type: "equipment",
        fulfillmentType: "pickup_rental",
        allowDirectPurchase: false,
        allowRfq: true,
        image: "eq-002-led.png",
        variants: [{ name: "تأجير يومي", priceCents: 150000, rentalUnit: "day" }],
      },
      {
        sku: "EQ-003",
        slug: "exhibition-booth-3x3",
        nameEn: "Modular Exhibition Booth (3x3m)",
        nameAr: "كشك عرض معياري (3×3 متر)",
        descriptionEn: "Modular 3x3m booth with backlit walls and reception counter, built and struck on site.",
        descriptionAr: "كشك عرض معياري بمقاس 3×3 متر مع جدران مضيئة وكاونتر استقبال، يشمل التركيب والفك.",
        type: "equipment",
        fulfillmentType: "pickup_rental",
        allowDirectPurchase: false,
        allowRfq: true,
        image: "eq-003-booth.png",
        variants: [{ name: "لكل فعالية", priceCents: 280000, rentalUnit: "event" }],
      },
    ],
  },
  {
    slug: "printing",
    nameEn: "Printing",
    nameAr: "الطباعة",
    products: [
      {
        sku: "PR-001",
        slug: "roll-up-banner-printing",
        nameEn: "Roll-Up Banner Printing",
        nameAr: "طباعة رول أب ستاند",
        descriptionEn: "Full-color roll-up banner printing with retractable stand, ready in 2 business days.",
        descriptionAr: "طباعة رول أب ستاند بألوان كاملة مع الحامل، جاهز خلال يومي عمل.",
        type: "printing",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "pr-001-rollup.png",
        variants: [
          { name: "مقاس 85×200 سم", priceCents: 35000 },
          { name: "مقاس 100×200 سم", priceCents: 42000 },
        ],
      },
      {
        sku: "PR-002",
        slug: "brochures-marketing-print",
        nameEn: "Brochures & Marketing Print",
        nameAr: "بروشورات ومطبوعات تسويقية",
        descriptionEn: "A5 tri-fold brochures, premium matte paper, printed and finished in-house.",
        descriptionAr: "بروشورات A5 مطوية ثلاثية، ورق مطفي فاخر، طباعة وتجهيز داخلي بالكامل.",
        type: "printing",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "pr-002-brochures.png",
        variants: [{ name: "1000 نسخة A5", priceCents: 120000 }],
      },
      {
        sku: "PR-003",
        slug: "flex-banner-printing",
        nameEn: "Flex Banner Printing",
        nameAr: "طباعة بنرات فليكس",
        descriptionEn: "Outdoor-grade flex vinyl banner printing, eyelets included, custom sizes available.",
        descriptionAr: "طباعة بنرات فليكس بجودة خارجية مع عروات تثبيت، مقاسات مخصصة متوفرة.",
        type: "printing",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "pr-003-flexbanner.png",
        variants: [{ name: "مقاس 3×2 متر", priceCents: 55000 }],
      },
    ],
  },
  {
    slug: "gifts",
    nameEn: "Promotional Gifts",
    nameAr: "الهدايا الترويجية",
    products: [
      {
        sku: "GF-001",
        slug: "branded-pens-pack",
        nameEn: "Branded Pens (Pack of 100)",
        nameAr: "أقلام مطبوعة بالشعار (100 قطعة)",
        descriptionEn: "Metal-body ballpoint pens with your logo printed, packed in boxes of 100.",
        descriptionAr: "أقلام حبر جاف بجسم معدني مع طباعة الشعار، معبأة في صناديق من 100 قطعة.",
        type: "gift",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "gf-001-pens.png",
        variants: [{ name: "100 قطعة", priceCents: 65000 }],
      },
      {
        sku: "GF-002",
        slug: "custom-thermal-mugs",
        nameEn: "Custom Thermal Mugs (Pack of 50)",
        nameAr: "أكواب حرارية مخصصة (50 قطعة)",
        descriptionEn: "Stainless steel insulated travel mugs with full-color logo printing.",
        descriptionAr: "أكواب حرارية من الستانلس ستيل مع طباعة الشعار بالألوان الكاملة.",
        type: "gift",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "gf-002-mugs.png",
        variants: [{ name: "50 قطعة", priceCents: 180000 }],
      },
    ],
  },
  {
    slug: "flags-apparel",
    nameEn: "Flags & Apparel",
    nameAr: "الأعلام والملابس",
    products: [
      {
        sku: "FL-001",
        slug: "printed-table-flag",
        nameEn: "Printed Table Flag",
        nameAr: "علم طاولة مطبوع",
        descriptionEn: "Desk-size table flag with custom print on both sides, includes mini pole and base.",
        descriptionAr: "علم طاولة بمقاس مكتبي مع طباعة مخصصة على الجهتين، يشمل العمود والقاعدة.",
        type: "other",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "fl-001-tableflag.png",
        variants: [{ name: "قطعة واحدة", priceCents: 15000 }],
      },
      {
        sku: "FL-002",
        slug: "embroidered-polo-shirt",
        nameEn: "Embroidered Polo Shirt",
        nameAr: "قميص بولو مطرز بالشعار",
        descriptionEn: "Corporate polo shirt with embroidered logo, available in multiple sizes.",
        descriptionAr: "قميص بولو للموظفين مع تطريز الشعار، متوفر بعدة مقاسات.",
        type: "other",
        fulfillmentType: "delivery",
        allowDirectPurchase: true,
        allowRfq: true,
        image: "fl-002-polo.png",
        variants: [
          { name: "مقاس M", priceCents: 18000 },
          { name: "مقاس L", priceCents: 18000 },
        ],
      },
    ],
  },
];

for (const cat of SEED) {
  const [existingCat] = await db.select().from(schema.categories).where(eq(schema.categories.slug, cat.slug));
  let categoryId: number;
  if (existingCat) {
    categoryId = existingCat.id;
    console.log(`category exists: ${cat.slug} (#${categoryId})`);
  } else {
    const [inserted] = await db
      .insert(schema.categories)
      .values({ nameEn: cat.nameEn, nameAr: cat.nameAr, slug: cat.slug })
      .returning();
    categoryId = inserted.id;
    console.log(`category created: ${cat.slug} (#${categoryId})`);
  }

  for (const p of cat.products) {
    const [existingProduct] = await db.select().from(schema.products).where(eq(schema.products.slug, p.slug));
    if (existingProduct) {
      console.log(`  product exists, skipping: ${p.slug}`);
      continue;
    }

    const [product] = await db
      .insert(schema.products)
      .values({
        sku: p.sku,
        slug: p.slug,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
        categoryId,
        type: p.type,
        fulfillmentType: p.fulfillmentType,
        allowDirectPurchase: p.allowDirectPurchase,
        allowRfq: p.allowRfq,
        isActive: true,
      })
      .returning();

    const key = await upload(p.image, `product-images/demo-seed/${p.sku}-${Date.now()}.png`);
    await db.insert(schema.productImages).values({
      productId: product.id,
      s3Key: key,
      altEn: p.nameEn,
      altAr: p.nameAr,
      sortOrder: 0,
    });

    for (const v of p.variants) {
      await db.insert(schema.productVariants).values({
        productId: product.id,
        name: v.name,
        priceCents: v.priceCents,
        currency: "JOD",
        rentalUnit: v.rentalUnit ?? null,
        isActive: true,
      });
    }

    console.log(`  product created: ${p.slug} -> ${publicUrl(key)}`);
  }
}

console.log("done");
