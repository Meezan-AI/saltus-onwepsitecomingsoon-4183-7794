# Saltus ONE — Design System

## Brand
Saltus ONE — premium digital transformation, AI, branding & printing company (Jordan). Logo: "Saltus" wordmark in white script on navy/orange tilted badge, "ONE" in navy/orange block letters below. Use `/images/logo-stacked.png` as primary logo (never put it in a box/container — keep it free-floating on dark backgrounds).

## Colors
- `--navy: #0B1F3A` (primary background, deep luxury base)
- `--navy-light: #142B4D` (secondary panels)
- `--orange: #FF6B00` (accent, CTAs, highlights, glow)
- `--orange-light: #FF8A3D`
- `--white: #FFFFFF`
- `--ink-muted: #B9C2D0` (body text on navy)
- Gradients: radial navy→black vignettes, orange glow blooms behind cards, subtle navy→orange diagonal sheens. No black backgrounds — always navy-based. No purple.

## Typography
- Display/headings: **Poppins** (700/800), tight tracking, large scale (clamp up to 5.5rem hero)
- Body: **Poppins** (400/500), generous line-height 1.7
- Small caps labels/eyebrows: Poppins 600, letter-spacing 0.2em, uppercase, orange

## Layout & Components
- Full-bleed sections, generous vertical rhythm (140-180px section padding desktop)
- Glassmorphism cards: `rgba(255,255,255,0.05)` bg, `backdrop-blur`, 1px white/10 border, rounded-2xl (24px), soft navy shadow + orange glow on hover
- Asymmetric grids for showcase/services, not uniform 3-col grids everywhere
- Floating particles / glowing orbs in hero (CSS animated blobs, no heavy JS particle lib needed)
- Horizontal timeline for "Our Process" with connecting line + numbered orange nodes
- Countdown component (days/hours/min/sec) in glass card for "Launching Soon"

## Motion (Motion/Framer Motion library)
- One staggered fade-up + slide reveal per section on scroll (viewport trigger, once)
- Hero: floating glass cards drift slowly (loop), orange light trail sweep
- Hover: scale 1.03 + orange glow intensify on cards/buttons
- Buttons: subtle magnetic/scale press

## Imagery
- Hero background: generated cinematic navy/orange tech environment (AI orbs, network lines, holographic UI)
- Service & showcase visuals: mix of generated premium mockups (AI/SaaS/websites/apps) + real catalog photography (`/catalog/page-XX.png` crops) for printing, apparel, flags, corporate gifts — never illustrated/cartoon for these, must look like real photography per client instruction
- Avoid generic stock-photo look; favor cinematic lighting, shallow depth of field

## Content Sections (order)
1. Sticky Nav (logo + links + Download Catalog button)
2. Hero — headline, subtitle, description, CTA buttons (Explore Services / Download Catalog)
3. Digital Solutions grid (Websites, SaaS, AI, Mobile, E-commerce, Digital Marketing)
4. Branding, Printing & Corporate Identity (catalog-backed real photos)
5. Why Saltus ONE (animated value cards)
6. Our Process (7-step horizontal timeline)
7. Showcase (portfolio mockup carousel)
8. Website Launching Soon (countdown)
9. Call To Action (cinematic, contact + download)
10. Contact + Footer (phone, email, site, socials)
