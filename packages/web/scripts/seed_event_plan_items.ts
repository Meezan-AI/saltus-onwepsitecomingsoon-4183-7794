/**
 * Seeds the starting checklist of the conference & event planner. Idempotent:
 * an item is created only when no item with the same group + English name exists,
 * so re-running never duplicates or overwrites what the admin has edited.
 * Products are linked by slug and only where the catalog item really is that thing —
 * everything else has no price and shows "requires a quote". Run from packages/web:
 *   bun --env-file=../../.env scripts/seed_event_plan_items.ts
 */
import { eq } from "drizzle-orm";
import { db } from "../src/api/database";
import * as schema from "../src/api/database/schema";

type V = [string, string];
const spec = (nameEn: string, nameAr: string, values: V[]) => ({ nameEn, nameAr, values: values.map(([en, ar]) => ({ en, ar })) });

const SIZE_PAPER = {
  a: spec("Size", "المقاس", [["A6", "A6"], ["A5", "A5"], ["A4", "A4"], ["A3", "A3"], ["DL", "DL"]]),
  paper: spec("Paper", "نوع الورق", [["Matte coated 150 gsm", "كوشيه مطفي 150 غرام"], ["Gloss coated 150 gsm", "كوشيه لامع 150 غرام"], ["Recycled 120 gsm", "ورق معاد تدويره 120 غرام"], ["Premium card 300 gsm", "كرتون فاخر 300 غرام"]]),
};
const COLORS = spec("Colour", "اللون", [["Navy", "كحلي"], ["Black", "أسود"], ["White", "أبيض"], ["Grey", "رمادي"], ["Orange", "برتقالي"], ["Custom (brand colour)", "حسب هوية الجهة"]]);

interface Seed {
  group: "printed" | "gifts" | "venue" | "services";
  en: string; ar: string; dEn?: string; dAr?: string;
  product?: string; qty: "attendees" | "one" | "none"; uEn?: string; uAr?: string;
  specs?: ReturnType<typeof spec>[];
}

const ITEMS: Seed[] = [
  // ---- Conference printing
  { group: "printed", en: "Agenda / programme", ar: "الأجندة / برنامج المؤتمر", dEn: "Printed programme booklet or leaflet for every attendee.", dAr: "كتيّب أو بروشور البرنامج لكل مشارك.", qty: "attendees", uEn: "copies", uAr: "نسخة",
    specs: [spec("Size", "المقاس", [["A5", "A5"], ["A4", "A4"], ["DL", "DL"]]), SIZE_PAPER.paper, spec("Finishing", "التشطيب", [["Folded", "طي"], ["Stapled booklet", "كتيّب دبوس"], ["Spiral bound", "تجليد حلزوني"], ["Laminated cover", "غلاف مغلّف"]])] },
  { group: "printed", en: "Brochures", ar: "البروشورات", dEn: "Marketing brochures, priced per catalog pack.", dAr: "بروشورات تسويقية، تُسعَّر حسب الباقة في الكتالوج.", product: "brochures-marketing-print", qty: "one", uEn: "packs", uAr: "باقة",
    specs: [SIZE_PAPER.paper, spec("Finishing", "التشطيب", [["Flat", "بدون طي"], ["Folded", "مطوي"], ["Laminated", "مغلّف"]])] },
  { group: "printed", en: "Name cards / table name tents", ar: "بطاقات الأسماء", dEn: "Name cards or table tents for seating.", dAr: "بطاقات أسماء أو أعلام طاولة للمقاعد.", qty: "attendees", uEn: "cards", uAr: "بطاقة",
    specs: [spec("Size", "المقاس", [["Business card size", "حجم بطاقة أعمال"], ["A6", "A6"], ["Folded tent", "مطوية قائمة"]]), SIZE_PAPER.paper] },
  { group: "printed", en: "Badges", ar: "الباجات", dEn: "Attendee badges with name and organisation.", dAr: "باجات المشاركين بالاسم والجهة.", qty: "attendees", uEn: "badges", uAr: "باج",
    specs: [spec("Type", "النوع", [["PVC card", "بطاقة PVC"], ["Paper insert + holder", "ورقة مع حامل"], ["Magnetic badge", "باج مغناطيسي"]]), spec("Size", "المقاس", [["A6 (105×148 mm)", "A6 (105×148 ملم)"], ["86×54 mm", "86×54 ملم"], ["100×70 mm", "100×70 ملم"]]), spec("Print", "الطباعة", [["One side", "وجه واحد"], ["Both sides", "وجهين"]])] },
  { group: "printed", en: "Badge lanyards", ar: "حبال تعليق الباجات", qty: "attendees", uEn: "lanyards", uAr: "حبل",
    specs: [spec("Width", "العرض", [["15 mm", "15 ملم"], ["20 mm", "20 ملم"], ["25 mm", "25 ملم"]]), COLORS, spec("Print", "الطباعة", [["One colour", "لون واحد"], ["Full colour", "ألوان كاملة"]])] },
  { group: "printed", en: "Certificates", ar: "الشهادات", dEn: "Attendance / appreciation certificates.", dAr: "شهادات حضور أو تقدير.", qty: "attendees", uEn: "certificates", uAr: "شهادة",
    specs: [spec("Size", "المقاس", [["A4", "A4"], ["A3", "A3"]]), spec("Paper", "نوع الورق", [["Certificate paper 250 gsm", "ورق شهادات 250 غرام"], ["Cream card 300 gsm", "كرتون كريمي 300 غرام"]]), spec("Finish", "التشطيب", [["Plain", "عادي"], ["Gold foil", "ختم ذهبي"], ["Embossed", "بارز"]])] },
  { group: "printed", en: "Tickets & invitations", ar: "التذاكر والدعوات", qty: "attendees", uEn: "tickets", uAr: "تذكرة",
    specs: [spec("Size", "المقاس", [["A6", "A6"], ["DL", "DL"], ["Ticket (210×70 mm)", "تذكرة (210×70 ملم)"]]), SIZE_PAPER.paper, spec("Features", "الخصائص", [["Numbered", "مرقّمة"], ["QR code", "رمز QR"], ["Perforated stub", "ذيل قابل للفصل"]])] },
  { group: "printed", en: "Directional signage", ar: "اللوحات الإرشادية", dEn: "Signs to guide attendees: registration, halls, restrooms, exits.", dAr: "لوحات توجيه: التسجيل، القاعات، دورات المياه، المخارج.", qty: "one", uEn: "signs", uAr: "لوحة",
    specs: [spec("Material", "الخامة", [["Foam board", "فوم بورد"], ["Forex / PVC", "فوركس / PVC"], ["Acrylic", "أكريليك"], ["Stand-up flex", "فليكس بحامل"]]), spec("Size", "المقاس", [["A3", "A3"], ["A2", "A2"], ["50×70 cm", "50×70 سم"], ["70×100 cm", "70×100 سم"]])] },

  // ---- Gifts & promotional
  { group: "gifts", en: "Bags", ar: "الحقائب", dEn: "Branded delegate bags.", dAr: "حقائب المشاركين بشعار الجهة.", qty: "attendees", uEn: "bags", uAr: "حقيبة",
    specs: [spec("Style", "الشكل", [["Tote bag", "حقيبة قماشية"], ["Document bag", "حقيبة مستندات"], ["Backpack", "حقيبة ظهر"], ["Laptop bag", "حقيبة لابتوب"]]), COLORS, spec("Material", "الخامة", [["Canvas", "قماش كانفاس"], ["Non-woven", "قماش غير منسوج"], ["Polyester", "بوليستر"], ["Leatherette", "جلد صناعي"]])] },
  { group: "gifts", en: "Notebooks", ar: "الدفاتر", qty: "attendees", uEn: "notebooks", uAr: "دفتر",
    specs: [spec("Size", "المقاس", [["A6", "A6"], ["A5", "A5"], ["B5", "B5"]]), spec("Cover", "الغلاف", [["Soft cover", "غلاف ناعم"], ["Hard cover", "غلاف مقوّى"], ["Leatherette", "جلد صناعي"]]), spec("Binding", "التجليد", [["Spiral", "حلزوني"], ["Stitched", "خياطة"], ["Elastic band", "مع رباط مطاطي"]]), COLORS] },
  { group: "gifts", en: "Branded pens", ar: "الأقلام", dEn: "Printed pens, priced per catalog pack.", dAr: "أقلام مطبوعة بالشعار، تُسعَّر حسب الباقة في الكتالوج.", product: "branded-pens-pack", qty: "one", uEn: "packs", uAr: "باقة",
    specs: [spec("Ink colour", "لون الحبر", [["Blue", "أزرق"], ["Black", "أسود"]]), spec("Barrel colour", "لون القلم", [["White", "أبيض"], ["Navy", "كحلي"], ["Black", "أسود"], ["Orange", "برتقالي"]])] },
  { group: "gifts", en: "Thermal mugs", ar: "الأكواب الحرارية", dEn: "Custom thermal mugs, priced per catalog pack.", dAr: "أكواب حرارية مخصصة، تُسعَّر حسب الباقة في الكتالوج.", product: "custom-thermal-mugs", qty: "one", uEn: "packs", uAr: "باقة",
    specs: [spec("Colour", "اللون", [["White", "أبيض"], ["Black", "أسود"], ["Navy", "كحلي"], ["Silver", "فضي"]])] },
  { group: "gifts", en: "Water bottles", ar: "قوارير المياه", qty: "attendees", uEn: "bottles", uAr: "قارورة",
    specs: [spec("Material", "الخامة", [["Stainless steel", "ستانلس ستيل"], ["Aluminium", "ألمنيوم"], ["Plastic (BPA-free)", "بلاستيك (خالٍ من BPA)"]]), spec("Capacity", "السعة", [["500 ml", "500 مل"], ["750 ml", "750 مل"]]), COLORS] },
  { group: "gifts", en: "Welcome kits", ar: "مجموعات الترحيب للمشاركين", dEn: "A packed welcome set for each participant — tell us what goes in it.", dAr: "مجموعة ترحيبية جاهزة لكل مشارك — أخبرنا بمحتوياتها.", qty: "attendees", uEn: "kits", uAr: "مجموعة",
    specs: [spec("Packaging", "التغليف", [["Gift box", "علبة هدية"], ["Bag", "حقيبة"], ["Envelope folder", "مغلف / ملف"]])] },

  // ---- Venue & exhibition setup
  { group: "venue", en: "Backdrop / photo wall", ar: "الباك دروب وخلفيات التصوير", dEn: "Stage backdrops and step-and-repeat photo walls.", dAr: "خلفيات المنصة وجدران التصوير.", qty: "one", uEn: "backdrops", uAr: "خلفية",
    specs: [spec("Type", "النوع", [["Flex banner", "فليكس"], ["Fabric (tension)", "قماش مشدود"], ["Step-and-repeat wall", "جدار تصوير"]]), spec("Size", "المقاس", [["3×2 m", "3×2 م"], ["4×3 m", "4×3 م"], ["6×3 m", "6×3 م"], ["Custom size", "مقاس خاص"]])] },
  { group: "venue", en: "Printed tablecloths", ar: "أغطية الطاولات المطبوعة", qty: "one", uEn: "covers", uAr: "غطاء",
    specs: [spec("Table size", "حجم الطاولة", [["6 ft", "6 قدم"], ["8 ft", "8 قدم"]]), spec("Fit", "الشكل", [["Fitted", "ملبّس"], ["Throw", "فرد"]])] },
  { group: "venue", en: "Roll-up banners", ar: "الرول أب", dEn: "Portable roll-up stands, priced per catalog size.", dAr: "ستاندات رول أب متنقلة، تُسعَّر حسب المقاس في الكتالوج.", product: "roll-up-banner-printing", qty: "one", uEn: "stands", uAr: "ستاند" },
  { group: "venue", en: "Flex banners", ar: "لافتات الفليكس", dEn: "Printed flex banners, priced per catalog size.", dAr: "لافتات فليكس مطبوعة، تُسعَّر حسب المقاس في الكتالوج.", product: "flex-banner-printing", qty: "one", uEn: "banners", uAr: "لافتة" },
  { group: "venue", en: "Table flags", ar: "أعلام الطاولات", dEn: "Printed table flags, priced per piece.", dAr: "أعلام طاولة مطبوعة، تُسعَّر بالقطعة.", product: "printed-table-flag", qty: "one", uEn: "flags", uAr: "علم" },
  { group: "venue", en: "Event flags", ar: "الأعلام", dEn: "Flagpole, feather and national flags.", dAr: "أعلام السواري والأعلام الريشية والوطنية.", qty: "one", uEn: "flags", uAr: "علم",
    specs: [spec("Type", "النوع", [["Flagpole flag", "علم سارية"], ["Feather flag", "علم ريشة"], ["National flag", "علم وطني"]]), spec("Size", "المقاس", [["90×150 cm", "90×150 سم"], ["120×180 cm", "120×180 سم"], ["Custom size", "مقاس خاص"]])] },
  { group: "venue", en: "Sponsor boards", ar: "لوحات الرعاة", dEn: "Sponsor and partner recognition boards.", dAr: "لوحات شكر وتعريف بالرعاة والشركاء.", qty: "one", uEn: "boards", uAr: "لوحة",
    specs: [spec("Material", "الخامة", [["Foam board", "فوم بورد"], ["Forex / PVC", "فوركس / PVC"], ["Acrylic", "أكريليك"]]), spec("Size", "المقاس", [["70×100 cm", "70×100 سم"], ["100×150 cm", "100×150 سم"], ["Custom size", "مقاس خاص"]])] },
  { group: "venue", en: "Counters", ar: "الكاونترات", dEn: "Branded reception, registration and information counters.", dAr: "كاونترات استقبال وتسجيل واستعلامات بهوية الجهة.", qty: "one", uEn: "counters", uAr: "كاونتر",
    specs: [spec("Use", "الاستخدام", [["Registration", "تسجيل"], ["Reception", "استقبال"], ["Information", "استعلامات"], ["Hospitality", "ضيافة"]]), spec("Length", "الطول", [["1 m", "1 م"], ["1.5 m", "1.5 م"], ["2 m", "2 م"]]), spec("Finish", "التشطيب", [["Branded graphics", "طباعة بالهوية"], ["White", "أبيض"], ["Wood look", "شكل خشبي"]])] },
  { group: "venue", en: "Modular exhibition booth 3×3 m", ar: "جناح عرض معياري 3×3 م", dEn: "Rental booth, priced per event.", dAr: "جناح عرض بالإيجار، يُسعَّر لكل فعالية.", product: "exhibition-booth-3x3", qty: "one", uEn: "booths", uAr: "جناح" },
  { group: "venue", en: "Curved pop-up exhibition booth", ar: "جناح بوب أب منحني", dEn: "Pop-up booth, priced per catalog size.", dAr: "جناح بوب أب، يُسعَّر حسب المقاس في الكتالوج.", product: "curved-pop-up-exhibition-booth-3-4-m", qty: "one", uEn: "booths", uAr: "جناح" },
  { group: "venue", en: "Mobile podium stand", ar: "منصة خطابة متنقلة", dEn: "Rental podium, priced per day.", dAr: "منصة خطابة بالإيجار، تُسعَّر باليوم.", product: "mobile-podium-stand", qty: "one", uEn: "podiums", uAr: "منصة" },
  { group: "venue", en: "Indoor LED display screen", ar: "شاشة LED للعرض الداخلي", dEn: "Rental LED screen, priced per day.", dAr: "شاشة LED بالإيجار، تُسعَّر باليوم.", product: "indoor-led-display-screen", qty: "one", uEn: "screens", uAr: "شاشة" },

  // ---- Services (all quoted by Saltus ONE)
  { group: "services", en: "Design & print-file preparation", ar: "التصميم وتجهيز الملفات للطباعة", dEn: "Our designers create or adapt your artwork and prepare print-ready files.", dAr: "يصمّم فريقنا أعمالك أو يعدّلها ويجهّز ملفات جاهزة للطباعة.", qty: "none",
    specs: [spec("Scope", "النطاق", [["New designs from scratch", "تصاميم جديدة كلياً"], ["Adapt existing artwork", "تعديل تصاميم موجودة"], ["Check & prepare my files only", "مراجعة وتجهيز ملفاتي فقط"]])] },
  { group: "services", en: "Printing & supply", ar: "الطباعة والتوريد", dEn: "Turnkey printing and supply of everything you selected.", dAr: "طباعة وتوريد كل ما اخترته بشكل متكامل.", qty: "none" },
  { group: "services", en: "Delivery to the event site", ar: "التوصيل إلى موقع الفعالية", qty: "none",
    specs: [spec("Drops", "عدد نقاط التسليم", [["Single location", "موقع واحد"], ["Multiple locations", "عدة مواقع"]])] },
  { group: "services", en: "Installation before the event", ar: "التركيب قبل الحدث", qty: "none",
    specs: [spec("Timing", "التوقيت", [["Day before the event", "اليوم السابق للفعالية"], ["Morning of the event", "صباح يوم الفعالية"], ["Several days before", "قبل الفعالية بعدة أيام"]])] },
  { group: "services", en: "Dismantling after the event", ar: "الفك بعد الحدث", qty: "none" },
  { group: "services", en: "On-site setup & supervision", ar: "تجهيز الموقع والإشراف الميداني", dEn: "A Saltus ONE supervisor at your venue, when available for your dates.", dAr: "مشرف من Saltus ONE في موقعك عند توفره في تواريخك.", qty: "none",
    specs: [spec("Team", "الفريق", [["Supervisor only", "مشرف فقط"], ["Supervisor + setup crew", "مشرف مع فريق تركيب"]])] },
];

const products = await db.select().from(schema.products);
const existing = await db.select().from(schema.eventPlanItems);
let created = 0;
for (const [index, it] of ITEMS.entries()) {
  if (existing.some((e) => e.groupKey === it.group && e.nameEn === it.en)) continue;
  let productId: number | null = null;
  if (it.product) {
    const p = products.find((x) => x.slug === it.product);
    if (!p) { console.warn(`skip link: product ${it.product} not found — "${it.en}" will require a quote`); }
    else productId = p.id;
  }
  await db.insert(schema.eventPlanItems).values({
    groupKey: it.group, nameEn: it.en, nameAr: it.ar, descEn: it.dEn ?? null, descAr: it.dAr ?? null,
    productId, qtyMode: it.qty, unitEn: it.uEn ?? null, unitAr: it.uAr ?? null,
    specsJson: JSON.stringify(it.specs ?? []), sortOrder: (index + 1) * 10, isActive: true,
  });
  created++;
}
console.log(`event plan items: ${created} created, ${ITEMS.length - created} already present`);
