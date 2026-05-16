# Validation Matrix — Da Vinci Studio
**Steps 4–6: Error validation, network testing, device testing**

Run this after the site is live at `https://davincistudio.ae`.

---

## §1 — Automated Validation (Step 7 equivalent)

Run immediately after any deployment:

```bash
node scripts/validate-production.mjs
# or against preview URL:
node scripts/validate-production.mjs https://davincistudio.pages.dev
```

Expected: `✓ All checks passed.`  
Exit code 0 = pass, 1 = failures, 2 = script error.

---

## §2 — Error Degradation Tests (Step 4)

### 2.1 WebGL Failure Simulation

**Chrome DevTools method:**
1. Open `https://davincistudio.ae`
2. DevTools → **Layers** panel (or Application → Storage)  
   OR: Navigate with `--disable-webgl` flag:
   ```
   chrome.exe --disable-webgl https://davincistudio.ae
   ```
3. **Expected behavior:**
   - Three.js canvas does not render (hidden by ErrorMonitor)
   - Rest of cinematic scroll still works (typography, scenes, CTA)
   - No uncaught JS exceptions in console
   - `webgl_failed` analytics event fired (visible in Umami if configured)

**Firefox method:**
1. `about:config` → `webgl.disabled` → set to `true`
2. Navigate to site
3. Same expected behavior as above

---

### 2.2 Chunk Load Failure Simulation

**Method:** DevTools → Network → Block request URLs
1. Open DevTools → Network tab → right-click any `/_astro/*.js` → "Block request URL"
2. Reload page
3. **Expected behavior:**
   - Page may show blank or partial render (acceptable — catastrophic JS failure)
   - No unhandled exception crash loop
   - Browser console shows `net::ERR_BLOCKED_BY_CLIENT` (not a site bug)
4. Unblock URLs after testing

---

### 2.3 Forced 404 Route Test

```
https://davincistudio.ae/nonexistent-page
https://davincistudio.ae/case-study/nonexistent-sub
https://davincistudio.ae/../etc/passwd
```

**Expected behavior for all:**
- HTTP 404 response
- Custom 404 page renders (dark theme, "Return home" link)
- No server error messages exposed

---

### 2.4 Offline / Throttled Network

**Chrome DevTools → Network → Throttling:**

| Profile | Test |
|---|---|
| **No throttling** | Baseline — boot should complete in < 2s |
| **Fast 3G** (~1.4 Mbps) | Loader should hold until Three.js bundle arrives |
| **Slow 3G** (~400 Kbps) | Loader should remain visible, then transition smoothly |
| **Offline** | Hard refresh — browser shows its offline page (no site-level cache) |

**What to verify on slow connections:**
- [ ] Loader bar / boot animation remains visible until JS hydrates
- [ ] No "flash of unstyled content" — fonts load non-blocking (Outfit/Bebas fallback to system font)
- [ ] Cinematic pacing still *feels intentional* even if delayed — the loader provides visual cover
- [ ] Three.js canvas appears after bundle arrives, not before

**Critical:** The cinematic experience was engineered for this — the boot sequence intentionally holds until the React island hydrates. Slow networks expose whether this contract holds.

---

### 2.5 Reduced Motion Mode

**macOS:** System Preferences → Accessibility → Display → Reduce motion: ON  
**Windows:** Settings → Ease of Access → Display → Show animations: OFF  
**Chrome:** DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion"

**Expected behavior:**
- [ ] PointerEngine: cursor follow effects disabled (coarse/reduced-motion guard active)
- [ ] CSS transitions: browser respects `@media (prefers-reduced-motion: reduce)` if any declared
- [ ] Scroll-driven scene changes: still progress (scroll is content navigation, not decoration)
- [ ] No JS errors related to animation teardown

---

## §3 — Real Network Testing (Step 5)

### Network performance targets

| Condition | Target | Acceptable |
|---|---|---|
| WiFi (home/office) | First cinematic scene < 3s | < 5s |
| Fast 3G | Loader → first scene < 8s | < 12s |
| Slow 3G | Loader holds (no blank) | No crash |
| UAE 4G (target market) | < 4s to first scene | < 6s |

### How to measure

**Chrome DevTools → Performance panel:**
1. Open DevTools → Performance → Start recording
2. Reload with Ctrl+Shift+R (hard reload)
3. Stop recording after first cinematic scene appears
4. Check:
   - **FCP** (First Contentful Paint): when loader first renders
   - **LCP** (Largest Contentful Paint): when primary scene text renders
   - **TTI** (Time to Interactive): when JS hydration completes

**WebPageTest (free, real devices):**
```
https://www.webpagetest.org/
URL: https://davincistudio.ae
Location: Dubai (closest to Abu Dhabi target market)
Browser: Chrome
Connection: Cable
```

**Key metrics to record:**

| Metric | Target | Measured |
|---|---|---|
| FCP | < 1.5s on cable | ___ |
| LCP | < 2.5s on cable | ___ |
| TBT (Total Blocking Time) | < 300ms | ___ |
| CLS (Cumulative Layout Shift) | < 0.1 | ___ |
| Three.js download (gzip) | ~170 KB | ___ |
| Time to cinematic boot complete | < 4s on cable | ___ |

---

## §4 — Device Test Matrix (Step 6)

For each device, record: FPS (smooth/choppy), typography (renders correctly), touch/scroll (stable), and any visual anomalies.

### Desktop

| Device / Config | Resolution | Test | Result |
|---|---|---|---|
| Windows Chrome | 1920×1080 | Full cinematic, pointer effects | ☐ |
| Windows Edge | 1920×1080 | Full cinematic | ☐ |
| Windows Firefox | 1920×1080 | Full cinematic | ☐ |
| MacBook Pro M-series | 2560×1600 (2x DPR) | High DPR Three.js rendering | ☐ |
| Ultrawide (21:9) | 3440×1440 | Layout reflow, no overflow | ☐ |
| 4K monitor | 3840×2160 | Typography scaling | ☐ |

**Desktop checklist (each browser):**
- [ ] Boot sequence completes cleanly
- [ ] Scroll advances scenes in correct order
- [ ] Pointer cursor follow effect active
- [ ] Three.js canvas renders (no blank white box)
- [ ] CTA links functional (email, WhatsApp, LinkedIn)
- [ ] `/case-study` loads and all 9 sections readable
- [ ] `/architecture` loads
- [ ] Back navigation from prose pages returns to homepage

---

### Mobile

| Device | OS | Browser | Test |
|---|---|---|---|
| iPhone 15 | iOS 17 | Safari | ☐ |
| iPhone 12 | iOS 15 | Safari | ☐ |
| iPhone SE | iOS 15 | Safari (small viewport) | ☐ |
| Samsung Galaxy S23 | Android 13 | Chrome | ☐ |
| Pixel 7 | Android 13 | Chrome | ☐ |
| Mid-range Android | Android 11 | Chrome | ☐ |

**Mobile checklist:**
- [ ] Pointer effects disabled (coarse pointer — expected)
- [ ] Scroll progresses cinematic scenes (touch scroll)
- [ ] Typography readable at mobile viewport (no overflow)
- [ ] CTAs tappable (min 44px touch target)
- [ ] No horizontal scroll on any page
- [ ] WhatsApp CTA opens WhatsApp app (not browser)
- [ ] Three.js WebGL renders (or degrades gracefully)
- [ ] Fonts load (Bebas Neue, Outfit)

---

### Tablet

| Device | OS | Browser | Test |
|---|---|---|---|
| iPad Pro 12.9" | iPadOS 17 | Safari | ☐ |
| iPad Air | iPadOS 16 | Safari | ☐ |

**Tablet checklist:**
- [ ] Layout between mobile and desktop breakpoints: no layout breaks
- [ ] Pointer/touch: treated as coarse (effects disabled, expected)
- [ ] Landscape orientation: no overflow

---

### Safari-specific checks

Safari has historically had issues with:
- **WebGL context loss** on power save mode → check Three.js doesn't crash
- **Backdrop-filter support** → verify any blur effects render
- **Scroll momentum** → cinematic scroll behavior with iOS elastic bounce
- **Font rendering** → Bebas Neue and Outfit weight differences vs Chrome

---

## §5 — Analytics Event Verification (Step 3)

Once Umami is configured and the site is live, verify events fire in the Umami dashboard:

### Manual verification flow

1. Open `https://davincistudio.ae` in an incognito window
2. Open Umami dashboard → **Realtime** view
3. Perform each action and confirm event appears:

| Action | Expected event | Umami path |
|---|---|---|
| Page load + scroll to hero | `scene_reached` (hero) | Events → scene_reached |
| Scroll through philosophy | `scene_reached` (philosophy) | Events |
| Scroll through services | `scene_reached` (services) | Events |
| Scroll through work | `scene_reached` (work) | Events |
| Scroll to CTA | `scene_reached` (cta) | Events |
| Click "Open to work" button | `cta_click` | Events |
| Click WhatsApp | `whatsapp_click` | Events |
| Click Case Study link | `case_study_open` | Events |
| Open `/case-study` | Page view | Pages |
| Open `/architecture` | Page view | Pages |
| Click LinkedIn | `linkedin_click` | Events |
| Click email | `email_click` | Events |

### Verify no console noise

With DevTools open, confirm:
- No `console.error` from analytics code
- No CORS errors on Umami beacon
- Events appear in Umami within 5–10 seconds

### Verify no duplicate events

Each `scene_reached` should fire **once per scene per session**.  
Scroll back and forth — confirm scene events don't fire twice for the same scene.

---

## §6 — Search Engine Validation (Step 7)

### Google Search Console

1. Add property: `https://davincistudio.ae`
2. Verify ownership via HTML tag (add to `Layout.astro` `<head>`) or DNS TXT record
3. Submit sitemap: `https://davincistudio.ae/sitemap-index.xml`
4. Request indexing for homepage via URL Inspection

### OG Preview Testing

| Tool | URL | Purpose |
|---|---|---|
| Twitter Card Validator | https://cards-dev.twitter.com/validator | Test Twitter/X preview |
| Facebook Debugger | https://developers.facebook.com/tools/debug/ | Test Facebook/OG preview |
| LinkedIn Post Inspector | https://www.linkedin.com/post-inspector/ | Test LinkedIn preview |
| OpenGraph.xyz | https://www.opengraph.xyz/ | Quick multi-platform preview |

**For each tool, test all 3 URLs:**
- `https://davincistudio.ae`
- `https://davincistudio.ae/case-study/`
- `https://davincistudio.ae/architecture/`

**Expected:**
- Title and description correct per page
- OG image renders (the SVG dark card)
- No "missing required properties" warnings

### securityheaders.com

```
https://securityheaders.com/?q=https%3A%2F%2Fdavincistudio.ae&followRedirects=on
```

**Target: Grade A**  
(CSP is present — may see "Missing HSTS" if CF isn't forcing HSTS. Enable in CF SSL/TLS settings.)

---

## §7 — Post-Launch Observation Window (Step 8)

Monitor for 48–72 hours after launch. Check Umami dashboard for:

### Traffic patterns to watch

| Signal | What it means | Action |
|---|---|---|
| High bounce on homepage | Boot sequence too slow or JS error | Check ErrorMonitor events, test on slow 3G |
| Low scene_reached depth | Users not scrolling past hero | Check mobile scroll behavior |
| `webgl_failed` events | WebGL errors in the wild | Verify fallback behavior is smooth |
| Case study open but no return | Expected — long-form content | No action needed |
| Mobile vs desktop split | Indicates audience | Optimize highest-traffic device |
| Spike then drop | Social share / link from LinkedIn | Monitor server response under load |

### Error signals

Check browser console errors via Umami custom events:
- Any `webgl_failed` events indicate real-world WebGL failures
- High `webgl_failed` rate on specific device types → investigate

### Performance signals

If Cloudflare Analytics (free tier) is enabled:
- Check cache hit ratio for `/_astro/*` — should be > 90% after warm
- Check bandwidth saved by Brotli compression
- Check edge requests by geography — confirm UAE traffic served from closest PoP
