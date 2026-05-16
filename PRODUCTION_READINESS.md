# Production Readiness Report — Da Vinci Studio
**Phase 15 · Release Engineering**  
Build: `astro-dark` branch · Node 22 · Astro 6 · React 19 · Three.js 0.183

---

## [✔] Deployment Target

**Primary: Cloudflare Pages**

| Host | Verdict | Reason |
|---|---|---|
| **Cloudflare Pages** | **Recommended** | Edge PoPs closest to Abu Dhabi (target market); native `_headers`/`_redirects`; automatic Brotli; instant cache purge per deploy; free unlimited bandwidth on static |
| Vercel | Supported | `vercel.json` included; clean URL routing; good DX; slightly higher latency to UAE |
| Netlify | Supported | `netlify.toml` included; comparable to Vercel; good branch preview workflow |

**Deployment files:**
- `public/_headers` — Cloudflare Pages native headers
- `public/_redirects` — Cloudflare Pages routing rules
- `vercel.json` — Vercel headers, redirects, cleanUrls
- `netlify.toml` — Netlify build config, headers, redirects
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD (build → preview → production)

**Required secrets (GitHub → Settings → Secrets → Actions):**
```
CF_API_TOKEN          Cloudflare API token (Edit Cloudflare Pages)
CF_ACCOUNT_ID         Cloudflare account ID
PUBLIC_UMAMI_URL      (optional) Umami analytics instance
PUBLIC_UMAMI_SITE_ID  (optional) Umami website ID
```

---

## [✔] Build Output Audit

| Check | Result |
|---|---|
| Build mode | `static` — all pages pre-rendered |
| Pages built | 7 (index, case-study, architecture, 404, hero-demo, index-new, old-index-new) |
| Public pages | 3 (index, /case-study/, /architecture/) |
| Dev pages | noindex=true on hero-demo and index-new |
| Sitemap | `sitemap-index.xml` + `sitemap-0.xml` — 3 public URLs only |
| 404 page | `dist/404.html` ✔ |
| Asset hashing | All `/_astro/*` filenames contain 8-char content hash |
| Duplicate chunks | None — `App.GiTXGewt.js` (118 B) is Astro island shim, not a dupe |
| React duplicated | No — single instance across all chunks |
| Env/secret leaks | None detected in client bundle |
| Three.js | Fully bundled (484 KB) — no CDN dependency |
| External scripts | None — zero third-party script risk |
| External fonts | Google Fonts (non-blocking `media=print` swap pattern) |
| Total JS payload | ~734 KB (Three.js dominates at 484 KB) |
| Build time | ~3.5 s |

---

## [✔] Cache Strategy

| Asset pattern | Cache-Control | Rationale |
|---|---|---|
| `/_astro/*` | `public, max-age=31536000, immutable` | Content-hash in filename; safe to cache forever |
| `/og/*` | `public, max-age=86400, stale-while-revalidate=604800` | OG images change rarely; allow background revalidation |
| `/favicon.*` | `public, max-age=604800, stale-while-revalidate=2592000` | Rarely changes |
| `/*.html` | `public, max-age=0, must-revalidate` | Always revalidate HTML — new deployments must reach users |
| `/sitemap*.xml` | `public, max-age=3600` | Reindex-safe |
| `/robots.txt` | `public, max-age=86400` | Stable, short window |

**Rollback safety:** All JS/CSS filenames are content-hashed. A rollback deploys different hashes, breaking no CDN caches. Old HTML files revalidate on next request and point to old-hash assets, which also still exist in CDN until evicted.

---

## [✔] Routing & Fallback

| Route | Behavior |
|---|---|
| `/` | `dist/index.html` — served directly |
| `/case-study/` | `dist/case-study/index.html` — direct navigation works |
| `/architecture/` | `dist/architecture/index.html` — direct navigation works |
| `/404` (any unknown path) | `dist/404.html` — Cloudflare/Vercel/Netlify all serve this automatically |
| `/index-new` | 301 → `/` (legacy redirect) |
| `/hero-demo` | 302 → `/` (dev page redirect) |

No SPA catch-all needed — Astro static output generates real HTML files at every route.

---

## [✔] Security Headers

Applied to all responses via `public/_headers`, `vercel.json`, and `netlify.toml`:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'none'; script-src 'self' 'unsafe-inline' https://*.umami.is; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.umami.is; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |

**CSP notes:**
- `'unsafe-inline'` on scripts: required for Astro's island hydration bootstrap (inline `<script>` tag). Cannot be removed without switching to nonce-based CSP, which requires SSR.
- `'unsafe-inline'` on styles: required for Tailwind CSS-in-JS and Astro scoped styles.
- Three.js: runs entirely in the JS bundle, no external script needed.
- Umami analytics: `connect-src` includes `*.umami.is` for the default Umami cloud; update to your self-hosted domain if applicable.

---

## [✔] Environment Configuration

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `PUBLIC_UMAMI_URL` | Client | No | Umami analytics script origin |
| `PUBLIC_UMAMI_SITE_ID` | Client | No | Umami website identifier |

- `PUBLIC_` prefix = Astro exposes to browser bundle (by design, non-secret)
- No private/server-only secrets are used by this static site
- Analytics is fully opt-in: both variables absent = no script emitted, zero overhead
- `.env` and `.env.production` are gitignored
- `.env.example` is committed as documentation

---

## [✔] Analytics Status

- **Provider:** Umami (self-hostable, GDPR-compliant, no cookies)
- **Status:** Integrated, no-op until env vars configured
- **Events tracked:** `scene_reached` (per scene), `cta_click`, `whatsapp_click`, `case_study_open`, `email_click`, `linkedin_click`, `architecture_open`, `boot_complete`, `webgl_failed`, `scroll_complete`
- **Scroll funnel:** Instruments each of 5 cinematic scenes once per session
- **Dev guard:** `trackEvent()` is a no-op in development (`import.meta.env.DEV`)

**To activate:** Set `PUBLIC_UMAMI_URL` and `PUBLIC_UMAMI_SITE_ID` in your deployment environment.

---

## [✔] Error Monitoring Status

- **Provider:** Custom `ErrorMonitor` (`src/core/monitoring/ErrorMonitor.ts`)
- **Captures:** `window.onerror`, `window.onunhandledrejection`, WebGL init failures
- **Production behavior:** Surfaces as analytics events (`webgl_failed`) — no external service required
- **Dev behavior:** `console.warn` only
- **WebGL fallback:** `ThreeCanvas` catches `WebGLRenderer` init errors and reports via `ErrorMonitor.report()`; UI degrades gracefully (canvas hidden, rest of cinematic experience continues)

---

## [✔] Accessibility Status

| Check | Status |
|---|---|
| Skip-to-content link | Present on all prose pages (case-study, architecture) |
| Focus-visible outlines | `:focus-visible` styles in `case-study.css` and global |
| Decorative elements | All atmosphere/visual layers have `aria-hidden="true"` |
| Reduced motion | `PointerEngine` skips JS-driven effects when `prefers-reduced-motion: reduce` |
| Touch/coarse pointer | Pointer effects disabled on touch devices (`pointer: coarse`) |
| Semantic HTML | Proper `<main id="main-content">`, heading hierarchy on prose pages |
| Color contrast | Dark background (#000) with light text (#f0f0f0) — high contrast |

---

## [✔] Browser Support Matrix

**Minimum supported browser versions** (based on runtime feature usage):

| Browser | Min Version | Notes |
|---|---|---|
| Chrome / Edge | 88+ | ResizeObserver, dynamic import, pointer events, WebGL2 |
| Firefox | 78+ | ESR baseline; all features supported |
| Safari | 14+ | ResizeObserver landed 14.0; WebGL2 in 15+ (graceful fallback to WebGL1) |
| iOS Safari | 14.0+ | Touch: pointer effects intentionally disabled (`pointer: coarse`) |
| Android Chrome | 88+ | Same as desktop Chrome |
| Samsung Internet | 12+ | Follows Chromium engine |

**Feature behavior by device type:**

| Feature | Desktop (mouse) | Touch device |
|---|---|---|
| Cinematic scroll | Full experience | Full experience |
| Pointer / cursor effects | Active (lerped follow) | Disabled (coarse pointer detected) |
| Three.js WebGL | Full 3D | Full 3D (or graceful hide on failure) |
| Typography | Outfit + Bebas Neue (Google Fonts) | Same, non-blocking load |
| Boot sequence | Full cinematic boot | Full cinematic boot |
| Reduced motion | Pointer effects paused | N/A |

**WebGL fallback:** If `WebGLRenderer` creation fails (old GPU, CSP-blocked canvas, privacy browser), `ThreeCanvas` hides the canvas element. The cinematic scroll, typography, and all text content remain fully functional.

**Font loading:** Non-blocking `media=print` swap technique. FOUT (Flash of Unstyled Text) is acceptable as system font renders first, then Outfit/Bebas Neue swap in. `<noscript>` fallback included for no-JS environments.

---

## [✔] Rollback Readiness

**Cloudflare Pages rollback:**
1. Open Cloudflare Dashboard → Pages → `davincistudio`
2. Click "Deployments" tab
3. Find the last good deployment → click "•••" → "Rollback to this deployment"
4. Instant — no rebuild required; CF serves the previous dist snapshot

**Git rollback:**
```bash
# Identify the last known-good commit
git log --oneline -10

# Create a revert commit (safe, non-destructive)
git revert HEAD --no-edit
git push

# Or reset branch to a specific commit (destructive — confirm first)
git reset --hard <commit-sha>
git push --force-with-lease
```

**Why rollbacks are safe:**
- All asset filenames are content-hashed — no stale file collisions between deployments
- HTML files always revalidate (max-age=0) — users get new HTML on next request
- `dist/` is fully self-contained — no database, no server state

---

## [✔] Performance Validation

| Metric | Value | Notes |
|---|---|---|
| JS payload | 734 KB total | Three.js (484 KB) + App (40 KB) + client runtime (184 KB) |
| Three.js | 484 KB | Unavoidable for WebGL; loaded async via island hydration |
| CSS payload | ~50 KB | Tailwind purged, case-study styles, analytics (empty) |
| HTML size | ~25 KB | Homepage with full meta, JSON-LD, island bootstrap |
| Build time | ~3.5 s | Deterministic, reproducible |
| Brotli compression | Enabled by CF Pages | Three.js bundle ~170 KB over wire |

**Performance architecture notes:**
- React island (`client:load`) — hydrates immediately but only one island on page
- Scene components are code-split per scene — parallel fetch, sequential execution
- RAF-only animation loop — no GSAP, no Framer Motion, zero layout thrash
- Google Fonts: non-blocking (`media=print` swap) — no render blocking
- WebGL canvas is `position:fixed` — never causes layout reflow

---

## Deployment Checklist

Before going live, complete these steps:

- [ ] Connect GitHub repo to Cloudflare Pages project `davincistudio`
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set Node.js version: `22`
- [ ] Add environment secrets: `CF_API_TOKEN`, `CF_ACCOUNT_ID`
- [ ] Add analytics secrets: `PUBLIC_UMAMI_URL`, `PUBLIC_UMAMI_SITE_ID` (optional)
- [ ] Configure custom domain: `davincistudio.ae` → Cloudflare Pages project
- [ ] Verify DNS: A record or CNAME pointing to Cloudflare Pages
- [ ] Test live URL: `https://davincistudio.ae` — cinematic boot, WebGL, scroll
- [ ] Test direct nav: `https://davincistudio.ae/case-study` — no 404
- [ ] Test direct nav: `https://davincistudio.ae/architecture` — no 404
- [ ] Verify OG meta: paste URL into Twitter Card Validator / LinkedIn Post Inspector
- [ ] Verify sitemap: `https://davincistudio.ae/sitemap-index.xml`
- [ ] Verify robots.txt: `https://davincistudio.ae/robots.txt`
- [ ] Check security headers: https://securityheaders.com → A grade target
- [ ] Submit sitemap to Google Search Console

---

*Report generated: Phase 15 — Release Engineering*  
*Branch: `astro-dark` · Build: clean · Pages: 7 · Errors: 0*
