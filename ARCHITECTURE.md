# Cinematic Portfolio System — Architecture Reference

**Project:** Da Vinci Studio portfolio  
**Branch:** `astro-dark`  
**Revision:** 13 (Phase 13 — productisation)  
**Stack:** Astro 6 · React 19 · Vite 6 · TypeScript  
**Build:** `npm run build` → `dist/` (static)

---

## Core design principle

Every running loop, every event listener, and every RAF tick in the system has exactly one owner. No component adds its own scroll listener. No component starts its own RAF loop. The ownership model is the architecture.

---

## Directory map

```
src/
├── boot/                         ← startup sequencing
│   ├── BootSystem.ts             — cinematic loader (2.38s sequence)
│   ├── CinematicOrchestrator.ts  — single startup authority
│   └── CinematicApp.tsx          — legacy; kept for reference
│
├── core/                         ← runtime engines (pure TypeScript singletons)
│   ├── scroll/ScrollEngine.ts    — Lenis v1 wrapper + visibilitychange guard
│   ├── interaction/
│   │   ├── PointerEngine.ts      — global LERP pointer tracker
│   │   └── usePointer.ts         — React subscription hook
│   ├── scene-engine/
│   │   ├── SceneController.ts    — scroll → state machine
│   │   ├── SceneRegistry.ts      — scroll range definitions
│   │   ├── SceneWrapper.tsx      — scroll-activation HOC
│   │   ├── useScene.ts           — SceneState hook
│   │   └── useSceneProgress.ts   — normalised 0–1 progress hook
│   └── observability/
│       ├── CinematicMonitor.ts   — DEV-only FPS + health singleton
│       └── DebugOverlay.tsx      — DEV-only Ctrl+Shift+D HUD
│
├── scenes/                       ← 6 scroll-driven content layers
│   ├── Hero/HeroScene.tsx
│   ├── Philosophy/PhilosophyScene.tsx
│   ├── Services/ServicesScene.tsx
│   ├── Work/WorkScene.tsx
│   ├── Logos/LogosScene.tsx
│   └── CTA/CTAScene.tsx
│
├── visual/                       ← atmosphere (aria-hidden, non-semantic)
│   ├── three/ThreeCanvas.tsx     — WebGL sphere (low-power, reduced-motion skip)
│   ├── atmosphere/
│   │   ├── DotGrid.tsx           — Canvas dot field
│   │   ├── DepthLayer.tsx        — scroll-driven vignette
│   │   └── CursorField.tsx       — radial cursor glow
│   └── signature/HeroSignature.tsx
│
├── styles/
│   ├── global.css                — resets, :root tokens
│   ├── scenes.css                — 1948-line cinematic CSS
│   └── case-study.css            — document CSS for /case-study, /architecture
│
├── layouts/
│   ├── Layout.astro              — main app shell
│   └── CaseStudyLayout.astro     — prose page shell
│
└── pages/
    ├── index.astro               — cinematic experience entry
    ├── case-study.astro          — design + engineering case study
    └── architecture.astro        — interactive version of this document
```

---

## Startup pipeline

`CinematicOrchestrator.run(callbacks)` is called once from `App.tsx`'s `useEffect`. It enforces strict ordering:

1. Register 6 scenes with `SceneController`
2. `ScrollEngine.initialize()` — Lenis created, RAF attached, **not started**
3. `PointerEngine.mount()` — mousemove listener + RAF loop
4. `callbacks.setDomReady(true)` — React renders app DOM (hidden behind loader)
5. `BootSystem.boot()` — 2.38s cinematic status sequence
6. `_triggerEntry()` — Lenis started, loader fades, `cinematic-entry` dispatched

**Fallback:** A 9-second `setTimeout` calls `_triggerEntry()` unconditionally. Any BootSystem failure is non-fatal — the app always becomes visible.

---

## Scene engine

`SceneController` maps normalised scroll progress (0–1) to one of three states per scene:

| State | Condition | Visual result |
|---|---|---|
| `inactive` | >5% outside range | opacity 0, blur 8–10px, translated off-screen |
| `secondary` | within 5% soft boundary | opacity 0.25–0.30, blur 2–4px, partial translateY |
| `primary` | within exact range | opacity 1, blur 0, at rest |

Scene scroll ranges (normalised 0–1):

| Scene | Start | End | Notes |
|---|---|---|---|
| hero | 0.00 | 0.15 | gated by cinematic-entry event |
| philosophy | 0.12 | 0.35 | overlaps hero for cross-dissolve |
| services | 0.32 | 0.55 | bento grid; per-card stagger |
| work | 0.52 | 0.78 | hover row dimming |
| logos | 0.75 | 0.90 | logo entry stagger |
| cta | 0.88 | 1.00 | pointer button lift |

**React integration:** `SceneController` notifies subscribers only on state changes — not every scroll frame. All `translateY` and per-frame effects use direct DOM style mutation on refs, not `setState`.

---

## Scroll engine

Lenis v1 configuration:
```
duration: 1.4  —  easing: t => 1 - (1-t)^3  —  direction: vertical
```

Resilience additions (Phase 9):
- `visibilitychange` handler: `lenis.stop()` on hide, `lenis.start()` on restore — prevents scroll jump on tab resume
- `document.hidden` guard in `start()` — no Lenis start if tab is hidden at boot time
- `try/catch` in `CinematicOrchestrator` — Lenis failure is non-fatal

---

## Pointer engine

Single global `mousemove` listener → delta-time-normalised LERP → subscriber notifications.

**LERP formula:**
```
factor = 1 - Math.pow(1 - LERP_60, dt / 16.667)   // LERP_60 = 0.055
```

At 60fps: 90% decay in ~40 frames (~667ms). Frame-rate independent — same wall-clock convergence at 30fps and 120fps.

**Output:** `{ x, y, cx, cy }` where `cx`/`cy` are normalised −1→+1 (0 = viewport centre).

**`sceneIntensity(sceneId)` multiplier:**
- `primary` → 1.0
- `secondary` → 0.3
- `inactive` → 0.0 (early return, no transform applied)

**Guards (both independently applied):**
- `(pointer: coarse)` — PointerEngine and CursorField both check on mount. Entire pointer system absent on touch devices.
- `prefers-reduced-motion` — PointerEngine tracks live media query changes. Subscriber callbacks skip while active. ThreeCanvas skips WebGL init entirely.

---

## Visual layer stack

| z-index | Layer | Technology | Update |
|---|---|---|---|
| 0 | DotGrid | Canvas 2D | Static draw; CSS translate drift |
| 1 | ThreeCanvas | WebGL / Three.js | RAF rotation; opacity 0.30 |
| 3 | DepthLayer | CSS gradients | ScrollEngine frameListener |
| 3 | CursorField | CSS radial-gradient | PointerEngine subscriber |
| 4–8 | Scene layers | React + CSS | SceneController state |
| 9 | HeroSignature | CSS pseudo-elements | Static |
| 9999 | Loader overlay | React inline styles | Unmounted 1.3s post-entry |

**atmosphereReady gate:** DotGrid, ThreeCanvas, DepthLayer, CursorField do not mount until `cinematic-entry` fires — RAF loops and WebGL context created only when they will be visible.

---

## Performance budget

| Metric | Value | Notes |
|---|---|---|
| Entry bundle (gzip) | 10.7 kB | Was 58 kB before Phase 11 |
| JS chunks total | 15 | 10 lazy-loaded post cinematic-entry |
| CDN dependencies | 0 | Three.js bundled from npm |
| Boot duration | 2.38s | Was 3.38s; Phase 12 audit |
| Compositor layers | ~15 | Within mobile GPU budget |
| TypeScript errors | 0 | tsc --strict; verified each phase |

**Lazy split points** (`React.lazy()` in `App.tsx`):
- Eager: HeroScene, BootSystem
- Lazy (post cinematic-entry): PhilosophyScene, ServicesScene, WorkScene, LogosScene, CTAScene
- Lazy + atmosphereReady gate: DotGrid, ThreeCanvas, DepthLayer, CursorField

**Three.js geometry budget:**

| Parameter | Before | After | Reason |
|---|---|---|---|
| Sphere segments | 64×64 | 32×32 | Imperceptible at display size + 30% opacity |
| Texture resolution | 1024px | 512px | No visible gain at 30% opacity |
| Pixel ratio cap | device max | 1.5 | Retina gain at 30% opacity ≈ 0 |
| Power preference | — | low-power | Battery + thermal on mobile |

---

## CSS easing system

Single easing token used across all transitions:

```css
--ease-cinema: cubic-bezier(0.16, 1, 0.3, 1);
```

This is an expo-out approximation. Fast initial acceleration, extremely soft settling tail. Visually resolves in ~70% of declared duration.

**Duration hierarchy:**

| Layer | Property | Duration |
|---|---|---|
| Scene transitions | opacity | 1.48–1.84s |
| Scene transitions | blur | 1.55–1.84s |
| Scene transitions | translateY | 1.84–2.0s |
| Hover micro-interactions | opacity / color | 0.2s |
| Boot loader | opacity | 0.8s |

**Exceptions:** `prefers-reduced-motion` override blocks retain bare `ease` — that is a semantic accessibility declaration, not a style inconsistency.

---

## Observability layer

All observability code is guarded by `import.meta.env.DEV`. Production cost: zero.

**`CinematicMonitor`** (dev singleton, exposed as `window.__cinematic`):
```
.snapshot()  → full engine health object
.history()   → last 50 scene transitions (ring buffer)
.fps()       → { avg1s, avg5s }
.health()    → { scrollReady, pointerReady, bootComplete }
.reset()     → clear FPS accumulators
```

**`DebugOverlay`** — toggle with `Ctrl+Shift+D`. Fixed position HUD, 1Hz polling via `setInterval`. Displays FPS (colour-coded), frame spikes, active scene, scroll %, pointer coordinates, engine health flags.

---

## Accessibility contract

Three degradation vectors, each handled at the correct layer:

**1. `prefers-reduced-motion` — CSS layer**
```css
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

**2. `prefers-reduced-motion` — JS layer**
PointerEngine reads and live-tracks `matchMedia('(prefers-reduced-motion: reduce)')`. If activated mid-session, pointer callbacks skip on the next RAF tick. ThreeCanvas never creates its WebGL renderer under reduced motion.

**3. Coarse pointer (touch devices)**
PointerEngine and CursorField both independently check `(pointer: coarse)` on mount. Both return before any listener or RAF registration. Defense in depth — not a single gate.

**Semantic markup:**
- Decorative layers carry `aria-hidden="true"`
- Correct heading hierarchy (h1 → h2 → h3) across all scenes
- CTA buttons are `<a>` with functional `href`, not `<div>` with click handlers

---

## Lifecycle contracts

| Engine | mount() / initialize() | unmount() / destroy() |
|---|---|---|
| ScrollEngine | Lenis created, RAF attached, NOT started | `lenis.destroy()`, RAF cancelled, visibilitychange removed |
| PointerEngine | mousemove + mouseleave on window (passive), RAF started | Stored listener references removed, RAF cancelled, `_lastTime` reset |
| CinematicOrchestrator | `run()` — one call | `cancel()` → ScrollEngine.destroy() + PointerEngine.unmount(), `_started = false` |

**React StrictMode:** `CinematicOrchestrator.cancel()` resets `_started = false` so the pipeline runs cleanly on the second mount cycle. Without this, StrictMode's unmount+remount would produce a blank app.

---

## Key design decisions rejected

| Decision | Rejected for |
|---|---|
| Scroll hijacking | Breaks native scroll contract; jarring on trackpads and touch |
| Per-frame React setState | Schedules reconciliation at 60fps; use direct DOM mutation on refs |
| Particle systems | Signals reference point is other portfolios, not client brands |
| Letter-stagger text reveals | Delays readability; friction for first-time visitors |
| Custom cursor replacement | Breaks spatial model of the pointing device |
| GSAP / Framer Motion | Obscures the system; every transition should be readable CSS |
| CDN script injection | Runtime network round-trip, invisible to bundler, no tree-shaking |

---

## Change log

| Date | Phase | Summary |
|---|---|---|
| 2026-03-27 | Init | Astro bootstrap, dark 3D version |
| 2026-03-28 | Fixes | Three.js CDN fixed, scripts to plain JS |
| 2026-05-13 | 1–6 | Full cinematic system rewrite |
| 2026-05-13 | 7 | Easing token normalisation |
| 2026-05-13 | 8 | System hardening (dead code, try/catch, passive listeners) |
| 2026-05-13 | 9 | Lifecycle hardening (listener leaks, dt-LERP, visibilitychange) |
| 2026-05-13 | 10 | Observability layer (CinematicMonitor, DebugOverlay) |
| 2026-05-13 | 11 | Production performance (lazy splitting, −82% entry bundle) |
| 2026-05-13 | 12 | Experience audit (pacing, content, mobile, semantic glow fix) |
| 2026-05-16 | 13 | Portfolio productisation (case study, architecture reference) |

---

## Commands

```bash
npm run dev      # development server (localhost:4321)
npm run build    # production build → dist/
npm run preview  # preview production build
```

**Dev tools:**
- `Ctrl+Shift+D` — toggle DebugOverlay (dev builds only)
- `window.__cinematic.snapshot()` — full engine health snapshot (dev builds only)

---

*Da Vinci Studio · Sajed Hamouda · Abu Dhabi, UAE*  
*© 2026 — Architecture Reference, Rev. 13*
