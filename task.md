# Saltus ONE — major upgrade (partners, portfolio, service pages, insights, testimonials, lead form, SEO)

## Decisions
- Client logos: professional placeholder marks (abstract SVG + sector label), easy to swap later.
- Testimonials: no names — job title + sector only.
- Lead form: store in DB (leads table) AND email to info@saltus-one.com (Resend, skipped gracefully if no key).
- Insights: 6 full articles, EN + AR.

## Steps
1. [x] types.ts: partners, portfolio, testimonials, insights, form, servicePage sections
2. [x] i18n en/ar content + insights-en.ts / insights-ar.ts (6 posts each)
3. [x] DB schema `leads` + api/routes/leads.ts + queries/leads.ts + db:push
4. [x] Components: partners (marquee), portfolio, testimonials, insights-teaser, lead-form, service-hero
5. [x] Pages: /portfolio, /insights, /insights/:slug, /services/:slug
6. [x] Update services-grid + footer links to /services/:slug; app.tsx routes
7. [x] SEO: LocalBusiness + Service schema, per-page meta for dynamic routes
8. [x] scripts/generate-sitemap.mjs -> public/sitemap.xml
9. [x] build + verify EN/AR + deliver
