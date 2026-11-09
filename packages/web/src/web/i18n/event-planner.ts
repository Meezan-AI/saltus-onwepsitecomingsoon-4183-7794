/** Copy for the conference & event planner («جهّز مؤتمرك»). Product / item names come from the database, not from here. */
export interface EventPlannerCopy {
  meta: { title: string; desc: string; keywords: string };
  cta: { eyebrow: string; title: string; desc: string; button: string };
  eyebrow: string;
  title: string;
  desc: string;
  stepOf: string;
  steps: { event: string; printed: string; gifts: string; venue: string; services: string; review: string; contact: string };
  back: string;
  next: string;
  reviewBtn: string;
  startOver: string;
  loading: string;
  loadError: string;
  event: {
    title: string;
    desc: string;
    typeLabel: string;
    types: { conference: string; exhibition: string; launch: string; meeting: string; other: string };
    nameLabel: string;
    namePlaceholder: string;
    dateLabel: string;
    daysLabel: string;
    daysHint: string;
    setupLabel: string;
    setupHint: string;
    cityLabel: string;
    cityPlaceholder: string;
    venueLabel: string;
    venuePlaceholder: string;
    attendeesLabel: string;
    missing: string;
    fieldRequired: string;
  };
  groups: Record<"printed" | "gifts" | "venue" | "services", { title: string; desc: string }>;
  item: {
    requiresQuote: string;
    from: string;
    perDay: string;
    perWeek: string;
    perEvent: string;
    optionLabel: string;
    qtyLabel: string;
    useAttendees: string;
    noteLabel: string;
    notePlaceholder: string;
    lineTotal: string;
    lineQuote: string;
    serviceNote: string;
    selected: string;
    days: string;
    weeks: string;
    chooseOption: string;
    skipGroup: string;
  };
  review: {
    title: string;
    desc: string;
    eventBox: string;
    attendees: string;
    setupDays: string;
    eventDays: string;
    itemsBox: string;
    empty: string;
    edit: string;
    qty: string;
    unit: string;
    total: string;
    quote: string;
    estimateAll: string;
    estimatePartial: string;
    estimateNone: string;
    partialNote: string;
    disclaimer: string;
    humanNote: string;
    needItems: string;
  };
  contact: {
    title: string;
    desc: string;
    name: string;
    company: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    submitting: string;
    needContact: string;
    badEmail: string;
    badPhone: string;
    needName: string;
    error: string;
  };
  success: {
    title: string;
    desc: string;
    reference: string;
    whatsapp: string;
    whatsappHint: string;
    back: string;
    another: string;
    waIntro: string;
  };
}

export const eventPlannerEn: EventPlannerCopy = {
  meta: {
    title: "Conference & Event Planner | Saltus ONE Marketplace",
    desc: "Plan your conference or event step by step — printing, gifts, exhibition setup and services — and request one detailed quote from Saltus ONE.",
    keywords: "conference planner, event supplies Jordan, exhibition setup, conference printing, request a quote, Saltus ONE",
  },
  cta: {
    eyebrow: "Conferences & events",
    title: "Get your conference ready",
    desc: "Tell us about your event, tick what you need — printing, gifts, booths and services — and get one detailed quote.",
    button: "Start planning",
  },
  eyebrow: "Event planner",
  title: "Get your conference ready",
  desc: "Answer a few questions, tick what you need, and send one detailed quote request. No payment, no commitment.",
  stepOf: "Step {n} of {total}",
  steps: {
    event: "Event",
    printed: "Printing",
    gifts: "Gifts",
    venue: "Venue",
    services: "Services",
    review: "Review",
    contact: "Send",
  },
  back: "Back",
  next: "Next",
  reviewBtn: "Review my plan",
  startOver: "Start over",
  loading: "Loading the planner...",
  loadError: "Couldn't load the planner. Please try again.",
  event: {
    title: "About your event",
    desc: "The basics, so we can size everything correctly.",
    typeLabel: "Type of event",
    types: { conference: "Conference", exhibition: "Exhibition", launch: "Launch event", meeting: "Meeting", other: "Other event" },
    nameLabel: "Event name (optional)",
    namePlaceholder: "e.g. Annual Medical Congress 2027",
    dateLabel: "Event date",
    daysLabel: "Event days",
    daysHint: "How many days the event runs.",
    setupLabel: "Setup days",
    setupHint: "Extra days before the event for setup, if different.",
    cityLabel: "City",
    cityPlaceholder: "e.g. Amman",
    venueLabel: "Hotel or venue (optional)",
    venuePlaceholder: "e.g. Dead Sea Convention Center",
    attendeesLabel: "Expected attendees",
    missing: "Please complete the highlighted fields (marked *) to continue.",
    fieldRequired: "Required",
  },
  groups: {
    printed: { title: "Conference printing", desc: "Programmes, badges, certificates, tickets and signs." },
    gifts: { title: "Gifts & promotional items", desc: "Bags, notebooks, pens, mugs and welcome kits for participants." },
    venue: { title: "Venue & exhibition setup", desc: "Backdrops, banners, flags, counters and exhibition booths." },
    services: { title: "Services", desc: "Design, delivery, installation and on-site support. These are always quoted by our team." },
  },
  item: {
    requiresQuote: "Requires a quote",
    from: "From",
    perDay: "per day",
    perWeek: "per week",
    perEvent: "per event",
    optionLabel: "Option",
    qtyLabel: "Quantity",
    useAttendees: "Match attendees ({n})",
    noteLabel: "Note (optional)",
    notePlaceholder: "Anything we should know about this item...",
    lineTotal: "Line total",
    lineQuote: "Will be priced in your quote",
    serviceNote: "Our team will price this service in your quote.",
    selected: "{n} selected",
    days: "days",
    weeks: "weeks",
    chooseOption: "Choose an option",
    skipGroup: "Nothing needed here? Just continue.",
  },
  review: {
    title: "Review your plan",
    desc: "Check everything below. Go back to any step to change it.",
    eventBox: "Event",
    attendees: "Attendees",
    setupDays: "Setup days",
    eventDays: "Event days",
    itemsBox: "Selected items",
    empty: "You haven't selected anything yet.",
    edit: "Edit",
    qty: "Qty",
    unit: "Unit price",
    total: "Total",
    quote: "Requires a quote",
    estimateAll: "Estimated total",
    estimatePartial: "Estimated total of priced items",
    estimateNone: "Everything in this plan will be priced in your quote.",
    partialNote: "{n} item(s) have no catalog price and will be priced in your quote.",
    disclaimer: "Estimates use current catalog prices. The final price is subject to confirmation by Saltus ONE.",
    humanNote: "Services and items that need special details are priced by our team in your quote.",
    needItems: "Select at least one item to continue.",
  },
  contact: {
    title: "Where should we send your quote?",
    desc: "Add your contact details. We'll prepare the quote and send it to you.",
    name: "Your name",
    company: "Company / organisation",
    phone: "Phone or WhatsApp",
    phonePlaceholder: "e.g. 079 123 4567 or +962 79 123 4567",
    email: "Email",
    notes: "Notes or special requirements",
    notesPlaceholder: "Branding guidelines, deadlines, budget, anything else...",
    submit: "Send quote request",
    submitting: "Sending...",
    needContact: "Please add a phone / WhatsApp number or an email.",
    badEmail: "That email doesn't look right.",
    badPhone: "That phone number doesn't look right. Include the country code if it's not a Jordan number.",
    needName: "Please enter your name.",
    error: "Couldn't send your request. Please check your details and try again.",
  },
  success: {
    title: "Request received",
    desc: "Thank you. Our team will prepare your detailed quote and send it to the contact details you gave us.",
    reference: "Reference number",
    whatsapp: "Also send it on WhatsApp",
    whatsappHint: "Optional: send the same summary straight to our WhatsApp for a faster reply.",
    back: "Back to marketplace",
    another: "Plan another event",
    waIntro: "Hello Saltus ONE, I just sent an event planner request.",
  },
};

export const eventPlannerAr: EventPlannerCopy = {
  meta: {
    title: "جهّز مؤتمرك | متجر سالتوس ONE",
    desc: "خطّط لمؤتمرك أو فعاليتك خطوة بخطوة — مطبوعات وهدايا وتجهيزات معارض وخدمات — واطلب عرض سعر مفصّلاً واحداً من سالتوس ONE.",
    keywords: "تجهيز مؤتمر, مطبوعات مؤتمرات الأردن, تجهيز معارض, طلب عرض سعر, سالتوس ONE",
  },
  cta: {
    eyebrow: "المؤتمرات والفعاليات",
    title: "جهّز مؤتمرك",
    desc: "أخبرنا عن فعاليتك، واختر ما تحتاجه من مطبوعات وهدايا وأجنحة وخدمات، واحصل على عرض سعر مفصّل واحد.",
    button: "ابدأ تخطيط الفعالية",
  },
  eyebrow: "مخطّط الفعاليات",
  title: "جهّز مؤتمرك",
  desc: "أجب عن بضعة أسئلة، واختر ما تحتاجه، وأرسل طلب عرض سعر مفصّلاً واحداً. بلا دفع وبلا التزام.",
  stepOf: "الخطوة {n} من {total}",
  steps: {
    event: "الفعالية",
    printed: "المطبوعات",
    gifts: "الهدايا",
    venue: "المكان",
    services: "الخدمات",
    review: "المراجعة",
    contact: "الإرسال",
  },
  back: "رجوع",
  next: "التالي",
  reviewBtn: "مراجعة طلبي",
  startOver: "البدء من جديد",
  loading: "جارٍ تحميل المخطّط...",
  loadError: "تعذّر تحميل المخطّط. حاول مرة أخرى.",
  event: {
    title: "عن فعاليتك",
    desc: "المعلومات الأساسية لنقدّر كل شيء بالشكل الصحيح.",
    typeLabel: "نوع الفعالية",
    types: { conference: "مؤتمر", exhibition: "معرض", launch: "حفل إطلاق", meeting: "اجتماع", other: "فعالية أخرى" },
    nameLabel: "اسم الفعالية (اختياري)",
    namePlaceholder: "مثال: المؤتمر الطبي السنوي 2027",
    dateLabel: "تاريخ الفعالية",
    daysLabel: "أيام الفعالية",
    daysHint: "عدد الأيام التي تستمر فيها الفعالية.",
    setupLabel: "أيام التجهيز",
    setupHint: "أيام إضافية قبل الفعالية للتجهيز، إن اختلفت.",
    cityLabel: "المدينة",
    cityPlaceholder: "مثال: عمّان",
    venueLabel: "الفندق أو موقع الفعالية (اختياري)",
    venuePlaceholder: "مثال: مركز الملك حسين بن طلال للمؤتمرات",
    attendeesLabel: "عدد الحضور المتوقع",
    missing: "الرجاء تعبئة الحقول المظلّلة بالأحمر (المعلّمة بـ *) للمتابعة.",
    fieldRequired: "مطلوب",
  },
  groups: {
    printed: { title: "مطبوعات المؤتمر", desc: "البرامج والباجات والشهادات والتذاكر واللوحات الإرشادية." },
    gifts: { title: "الهدايا والمواد الدعائية", desc: "الحقائب والدفاتر والأقلام والأكواب ومجموعات الترحيب للمشاركين." },
    venue: { title: "تجهيزات المكان والمعرض", desc: "الخلفيات واللافتات والأعلام والكاونترات وأجنحة العرض." },
    services: { title: "الخدمات", desc: "التصميم والتوصيل والتركيب والدعم الميداني. يُسعّرها فريقنا دائماً ضمن العرض." },
  },
  item: {
    requiresQuote: "يتطلب عرض سعر",
    from: "ابتداءً من",
    perDay: "لليوم",
    perWeek: "للأسبوع",
    perEvent: "للفعالية",
    optionLabel: "الخيار",
    qtyLabel: "الكمية",
    useAttendees: "مطابقة عدد الحضور ({n})",
    noteLabel: "ملاحظة (اختياري)",
    notePlaceholder: "أي تفاصيل تريد أن نعرفها عن هذا الصنف...",
    lineTotal: "إجمالي البند",
    lineQuote: "سيُسعَّر ضمن العرض",
    serviceNote: "سيقوم فريقنا بتسعير هذه الخدمة ضمن العرض.",
    selected: "تم اختيار {n}",
    days: "أيام",
    weeks: "أسابيع",
    chooseOption: "اختر خياراً",
    skipGroup: "لا تحتاج شيئاً هنا؟ تابع مباشرة.",
  },
  review: {
    title: "مراجعة طلبك",
    desc: "راجع كل شيء أدناه. يمكنك الرجوع إلى أي خطوة لتعديلها.",
    eventBox: "الفعالية",
    attendees: "عدد الحضور",
    setupDays: "أيام التجهيز",
    eventDays: "أيام الفعالية",
    itemsBox: "الأصناف المختارة",
    empty: "لم تختر أي صنف بعد.",
    edit: "تعديل",
    qty: "الكمية",
    unit: "سعر الوحدة",
    total: "الإجمالي",
    quote: "يتطلب عرض سعر",
    estimateAll: "الإجمالي التقديري",
    estimatePartial: "الإجمالي التقديري للأصناف المسعّرة",
    estimateNone: "جميع أصناف هذا الطلب ستُسعَّر ضمن العرض.",
    partialNote: "{n} من الأصناف ليس لها سعر في الكتالوج وستُسعَّر ضمن العرض.",
    disclaimer: "التقديرات مبنية على أسعار الكتالوج الحالية. والسعر النهائي يخضع لتأكيد Saltus ONE.",
    humanNote: "الخدمات والأصناف التي تحتاج تفاصيل خاصة يسعّرها فريقنا ضمن العرض.",
    needItems: "اختر صنفاً واحداً على الأقل للمتابعة.",
  },
  contact: {
    title: "أين نرسل لك عرض السعر؟",
    desc: "اكتب بيانات التواصل وسنجهّز العرض ونرسله لك.",
    name: "الاسم",
    company: "الشركة أو الجهة",
    phone: "الهاتف أو الواتساب",
    phonePlaceholder: "مثال: 0791234567 أو ‎+962791234567",
    email: "البريد الإلكتروني",
    notes: "ملاحظات أو متطلبات خاصة",
    notesPlaceholder: "إرشادات الهوية، المواعيد، الميزانية، أي أمر آخر...",
    submit: "إرسال طلب عرض السعر",
    submitting: "جارٍ الإرسال...",
    needContact: "الرجاء كتابة رقم هاتف / واتساب أو بريد إلكتروني.",
    badEmail: "البريد الإلكتروني غير صحيح.",
    badPhone: "رقم الهاتف غير صحيح. أضف رمز الدولة إن لم يكن رقماً أردنياً.",
    needName: "الرجاء كتابة اسمك.",
    error: "تعذّر إرسال طلبك. تحقق من بياناتك وحاول مرة أخرى.",
  },
  success: {
    title: "تم استلام طلبك",
    desc: "شكراً لك. سيجهّز فريقنا عرض السعر المفصّل ويرسله إلى بيانات التواصل التي كتبتها.",
    reference: "الرقم المرجعي",
    whatsapp: "أرسله لنا أيضاً على واتساب",
    whatsappHint: "اختياري: أرسل الملخص نفسه إلى واتساب سالتوس لرد أسرع.",
    back: "العودة إلى المتجر",
    another: "تخطيط فعالية أخرى",
    waIntro: "مرحباً سالتوس ONE، أرسلت للتو طلباً عبر مخطّط الفعاليات.",
  },
};
