import { Reveal } from "./reveal";

const ITEMS = [
  {
    title: "Large Format Printing",
    desc: "Roll-up banners, X-banners, pop-up displays, backdrops, vehicle wraps and signage.",
    img: "/images/crop-xbanner.png",
    span: "lg:col-span-7",
  },
  {
    title: "Apparel Printing",
    desc: "Corporate uniforms, polo shirts, embroidery, DTF and screen printing.",
    img: "/images/crop-apparel.png",
    span: "lg:col-span-5",
  },
  {
    title: "Printing Solutions",
    desc: "Business cards, catalogs, brochures, folders and offset & digital printing.",
    img: "/images/crop-printing.png",
    span: "lg:col-span-5",
  },
  {
    title: "Flags & Signage",
    desc: "National flags, corporate flags, display stands and window graphics.",
    img: "/images/crop-flags.png",
    span: "lg:col-span-7",
  },
  {
    title: "Corporate Gifts",
    desc: "Executive gift sets, tech accessories, drinkware and eco-friendly promotional gifts.",
    img: "/images/crop-gifts.png",
    span: "lg:col-span-12",
  },
];

export function BrandingPrinting() {
  return (
    <section id="branding" className="relative bg-[#060f1f] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
            Branding, Printing &amp; Corporate Identity
          </span>
          <h2 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            Craftsmanship That Makes Brands Visible
          </h2>
          <p className="mt-5 text-[#B9C2D0]">
            Real work, real production — from luxury logo presentation to large format printing and corporate gifts.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.08} className={it.span}>
              <div className="glass-card glow-orange group relative h-72 overflow-hidden rounded-3xl">
                <img
                  src={it.img}
                  alt={it.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060f1f] via-[#060f1f]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl font-bold text-white">{it.title}</h3>
                  <p className="mt-1 max-w-md text-sm text-[#B9C2D0]">{it.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
