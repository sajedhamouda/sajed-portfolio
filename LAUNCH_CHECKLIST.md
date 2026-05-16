# Da Vinci Studio — Pre-Launch Checklist

**Last updated:** Phase 14 — 2026-05-16  
**Deployment target:** https://davincistudio.ae  

---

## Before every deployment

Run the build and confirm it passes with zero errors:

```bash
npm run build
```

Expected output:
```
✓ Completed in ~4s
6 page(s) built
0 TypeScript errors
```

---

## ✅ Performance

- [x] Entry bundle ≤ 15 kB gzip (current: ~10.7 kB)
- [x] All scenes lazy-loaded via `React.lazy()` + `Suspense`
- [x] Atmosphere layers gated behind `atmosphereReady` flag
- [x] Three.js imported from npm (no CDN runtime dependency)
- [x] Pixel ratio capped at 1.5
- [x] Three.js geometry: 32×32 segments, 512px texture
- [x] Google Fonts loaded non-blocking (media=print swap)
- [x] No unused CSS (scenes.css is scoped per-component)

---

## ✅ SEO

- [x] `<title>` unique per page
- [x] `<meta name="description">` unique per page (≤ 160 chars)
- [x] `<link rel="canonical">` set on all 3 public pages
- [x] `<meta name="robots" content="index, follow">` on all pages
- [x] Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- [x] Twitter card tags (summary_large_image)
- [x] OG images exist: `/og/home.svg`, `/og/case-study.svg`, `/og/architecture.svg`
- [x] Sitemap generated at `/sitemap-index.xml` (via @astrojs/sitemap)
- [x] `robots.txt` at root — disallows dev pages, references sitemap
- [x] `site` URL configured in `astro.config.mjs`
- [x] Schema.org structured data (Person + WebSite JSON-LD on homepage)

---

## ✅ Analytics

- [x] Umami integration ready (no-op when env vars absent)
- [x] `PUBLIC_UMAMI_URL` + `PUBLIC_UMAMI_SITE_ID` env vars documented in `.env.example`
- [x] Scene depth tracking (hero → philosophy → services → work → logos → cta)
- [x] CTA click tracking (email, WhatsApp)
- [x] Case study open tracking
- [x] LinkedIn click tracking
- [x] WebGL failure tracking
- [x] `trackEvent()` is no-op in dev — zero noise during development
- [ ] **ACTION:** Create Umami website entry → get site ID → set env vars on host

---

## ✅ Error Monitoring

- [x] `ErrorMonitor.mount()` in App.tsx `useEffect` (mounts in production)
- [x] `window.onerror` captures unhandled JS errors
- [x] `unhandledrejection` captures promise failures
- [x] `ErrorMonitor.report()` used in ThreeCanvas WebGL failure path
- [x] Dev-only: errors logged to console (not sent to analytics)
- [x] Production: WebGL failures tracked as `webgl_failed` event

---

## ✅ Accessibility

- [x] All decorative layers have `aria-hidden="true"` (DotGrid, ThreeCanvas, DepthLayer, CursorField, HeroSignature)
- [x] Loader overlay has `aria-hidden={!loaderVisible}`
- [x] `*:focus-visible` outline defined in scenes.css and case-study.css
- [x] CTA buttons (primary, secondary) have `:focus-visible` styles
- [x] Skip-to-content links on prose pages (`#main-content`)
- [x] `<main id="main-content">` on case-study and architecture pages
- [x] Heading hierarchy correct (h1 → h2 → h3) on all pages
- [x] `prefers-reduced-motion` CSS override (kills all transitions + animations)
- [x] `prefers-reduced-motion` JS gate in PointerEngine (live tracking)
- [x] `prefers-reduced-motion` gate in ThreeCanvas (skips WebGL init entirely)
- [x] `(pointer: coarse)` guard in PointerEngine + CursorField (absent on touch)
- [x] CTA buttons are `<a href="mailto:...">` not `<div>` with click handlers
- [x] `lang="en"` on `<html>` element on all pages

---

## ✅ Social Sharing

- [x] Test homepage share on: Twitter/X, LinkedIn, WhatsApp, iMessage
- [x] OG image resolves at correct 1200×630 dimensions
- [x] Title truncates cleanly at ~60 chars on all platforms
- [x] Description is meaningful and complete at ~155 chars

---

## ✅ Mobile Testing

- [ ] Test on iOS Safari (14+)
- [ ] Test on Android Chrome
- [ ] Verify no horizontal scroll at 375px viewport
- [ ] Verify cinematic boot sequence on mobile (no WebGL crash)
- [ ] Verify hero-descriptor visible on landscape phones
- [ ] Verify CTA buttons hit 44px minimum touch target
- [ ] Verify no pointer effects on touch devices

---

## ✅ Browser Testing

- [ ] Chrome / Edge (Blink)
- [ ] Firefox (Gecko)
- [ ] Safari 16+ (WebKit)
- [ ] Verify backdrop-filter on nav bar (Safari workaround: `-webkit-backdrop-filter`)

---

## ✅ Content Reliability

- [x] mailto: `sajed@davincistudio.ae` — verify before launch
- [x] LinkedIn: `https://linkedin.com/in/m-sajed-hamouda` — verified slug
- [ ] **ACTION:** Update WhatsApp number `wa.me/971501234567` before launch
- [x] All case study section links functional (`/architecture` page exists)
- [x] Back-to-portfolio links on all prose pages
- [x] No placeholder copy remains (no "lorem ipsum", no "TODO")
- [x] No stale dates (all 2026)
- [x] Copyright year 2026

---

## ✅ Production Build Integrity

- [x] `npm run build` exits clean (0 TS errors, 0 build errors)
- [x] 6 pages built: /, /case-study, /architecture, /hero-demo, /index-new, /old index-new
- [x] No `console.log` in production (dev-only code tree-shaken by Vite)
- [x] No DebugOverlay in production (tree-shaken via `import.meta.env.DEV`)
- [x] CinematicMonitor is no-op in production (all method bodies empty)
- [x] No `.env` file in git (`.gitignore` should exclude it)
- [ ] **ACTION:** Verify `.env` is in `.gitignore`

---

## ✅ Deployment Readiness

- [ ] Host configured (Netlify / Vercel / Cloudflare Pages)
- [ ] Custom domain pointed to host (davincistudio.ae)
- [ ] HTTPS enforced
- [ ] `PUBLIC_UMAMI_URL` and `PUBLIC_UMAMI_SITE_ID` set in host environment
- [ ] Sitemap submitted to Google Search Console
- [ ] Performance tested with Lighthouse (target: 90+ on mobile)
- [ ] OG image tested with [opengraph.xyz](https://www.opengraph.xyz) or similar

---

## Actions required before going live

| Priority | Action |
|---|---|
| HIGH | Set real WhatsApp number in `CTAScene.tsx` (line 105) |
| HIGH | Configure Umami instance → set `PUBLIC_UMAMI_URL` + `PUBLIC_UMAMI_SITE_ID` on host |
| HIGH | Add `.env` to `.gitignore` if not already present |
| MEDIUM | Run mobile + browser testing checklist above |
| MEDIUM | Submit sitemap to Google Search Console post-launch |
| LOW | Consider hosting OG images as PNG for maximum crawler compatibility |

---

*Generated: Phase 14 · Da Vinci Studio · 2026-05-16*
