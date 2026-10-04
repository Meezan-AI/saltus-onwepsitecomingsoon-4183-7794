export type ServiceItem = {
  slug: string;
  title: string;
  short: string;
  desc: string;
  img: string;
  bullets: string[];
};

export type InsightPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMinutes: number;
  author: string;
  authorRole: string;
  authorImage: string;
  cover: string;
  body: string[];
  keywords: string;
};

export type Content = {
  meta: {
    siteName: string;
    home: { title: string; desc: string; keywords: string };
    services: { title: string; desc: string; keywords: string };
    conferences: { title: string; desc: string; keywords: string };
    about: { title: string; desc: string; keywords: string };
    contact: { title: string; desc: string; keywords: string };
    portfolio: { title: string; desc: string; keywords: string };
    insights: { title: string; desc: string; keywords: string };
    businessCard: { title: string; desc: string; keywords: string };
  };
  nav: {
    home: string;
    services: string;
    conferences: string;
    portfolio: string;
    insights: string;
    about: string;
    contact: string;
    catalog: string;
    menu: string;
    langToggle: string;
  };
  hero: {
    badge: string;
    titleA: string;
    titleHighlight: string;
    titleB: string;
    desc: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaVideo: string;
    divisions: string;
    videoTitle: string;
    videoClose: string;
    chips: string[];
  };
  stats: { value: string; label: string }[];
  intro: {
    eyebrow: string;
    title: string;
    p1: string;
    p2: string;
    points: string[];
  };
  services: {
    eyebrow: string;
    title: string;
    desc: string;
    viewAll: string;
    learnMore: string;
    items: ServiceItem[];
  };
  conferences: {
    eyebrow: string;
    title: string;
    desc: string;
    ctaLabel: string;
    capabilities: { title: string; desc: string }[];
    scope: { title: string; items: string[] }[];
    types: string[];
  };
  why: {
    eyebrow: string;
    title: string;
    items: { title: string; desc: string }[];
  };
  process: {
    eyebrow: string;
    title: string;
    steps: { title: string; desc: string }[];
  };
  showcase: {
    eyebrow: string;
    title: string;
    items: { title: string; tag: string; img: string }[];
  };
  industries: {
    eyebrow: string;
    title: string;
    desc: string;
    items: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  cta: {
    title: string;
    highlight: string;
    desc: string;
    btn1: string;
    btn2: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    desc: string;
    callLabel: string;
    emailLabel: string;
    webLabel: string;
    whatsappLabel: string;
    whatsappCta: string;
    hoursLabel: string;
    hours: string;
    locationLabel: string;
    location: string;
  };
  businessCard: {
    linkLabel: string;
    footerLink: string;
    promptTitle: string;
    promptDesc: string;
    eyebrow: string;
    tagline: string;
    title: string;
    intro: string;
    labels: { phone: string; whatsapp: string; email: string; website: string };
    actions: {
      call: string;
      whatsapp: string;
      email: string;
      website: string;
      facebook: string;
      youtube: string;
      save: string;
      saveHint: string;
      share: string;
      copy: string;
      copied: string;
      shareText: string;
    };
    footerNote: string;
  };
  footer: {
    tagline: string;
    quickLinks: string;
    servicesTitle: string;
    contactTitle: string;
    followUs: string;
    rights: string;
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    body: string[];
    missionTitle: string;
    mission: string;
    visionTitle: string;
    vision: string;
    valuesTitle: string;
    values: { title: string; desc: string }[];
  };
  servicesPage: {
    eyebrow: string;
    title: string;
    lead: string;
  };
  partners: {
    eyebrow: string;
    title: string;
    desc: string;
    note: string;
    items: { label: string; sector: string }[];
  };
  portfolio: {
    eyebrow: string;
    title: string;
    desc: string;
    viewAll: string;
    all: string;
    pageTitle: string;
    pageLead: string;
    achievementLabel: string;
    categories: { id: string; label: string }[];
    items: {
      title: string;
      category: string;
      img: string;
      desc: string;
      achievement: string;
    }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    desc: string;
    verified: string;
    items: { quote: string; role: string; sector: string }[];
  };
  insights: {
    eyebrow: string;
    title: string;
    desc: string;
    viewAll: string;
    readMore: string;
    minRead: string;
    pageTitle: string;
    pageLead: string;
    backToList: string;
    relatedTitle: string;
    shareTitle: string;
    posts: InsightPost[];
  };
  form: {
    title: string;
    desc: string;
    name: string;
    namePh: string;
    company: string;
    companyPh: string;
    email: string;
    emailPh: string;
    phone: string;
    phonePh: string;
    interest: string;
    interestPh: string;
    message: string;
    messagePh: string;
    submit: string;
    sending: string;
    successTitle: string;
    successMsg: string;
    pendingMsg: string;
    errorMsg: string;
    privacy: string;
    orCall: string;
    interestOptions: { value: string; label: string }[];
  };
  servicePage: {
    breadcrumb: string;
    overviewTitle: string;
    deliverablesTitle: string;
    whyTitle: string;
    formTitle: string;
    formDesc: string;
    relatedTitle: string;
    backToServices: string;
    talkToTeam: string;
  };
};
