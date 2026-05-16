# Portfolio Grid Layout Design (2026-04-14)

## Overview
We are completing a new portfolio‑grid layout that includes:
- **NumberedCards** component for displaying portfolio items with numbered headings.
- **ScrollHint** animation that appears at the bottom of the page on initial load and hides after the first scroll event.
- **ThreeBackground** visual that renders a rotating mandala sphere using Three.js loaded from a CDN.

The design follows **Approach 1**: an auto‑fit responsive grid, simple scroll‑hint logic, and CDN‑loaded Three.js.

## Components
### 1. `NumberedCards.astro`
- Props: `items` (array of `{ number, title, description }`) and optional `title`.
- Layout: grid of cards with a numbered badge, title, description, and a hover bar.
- Styling: uses `Bebas Neue` for headings and `Outfit` for body text. Hover effects change background and number color.
- Responsive: collapses to a single column on screens < 768 px.

### 2. `PortfolioGrid.astro`
- Renders a list of projects as clickable cards.
- Grid uses `display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));` to automatically adjust column count based on available width.
- Each card includes a logo, overlay with category, name, and arrow.
- Gap of `2px` creates a subtle separation.

### 3. `ScrollHint.astro`
- Fixed element at the bottom‑center of the page showing the word “scroll” and a bouncing arrow.
- JavaScript attaches a `scroll` listener that adds the `hidden` class after the first scroll event, causing the hint to fade out.
- **Improvement:** Replace the listener with an `IntersectionObserver` that hides the hint once the `PortfolioGrid` enters the viewport while still retaining the original “first scroll” behavior.

### 4. `ThreeBackground.astro`
- Adds a full‑screen `<canvas>` with a mandala sphere texture.
- Loads Three.js from the CDN (`cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`).
- Initializes a scene, camera, renderer, and a rotating sphere with a custom canvas texture.
- Listens for window resize to keep the canvas proportional.

## Interaction Flow
1. Page loads → `ThreeBackground` renders the mandala sphere.
2. `ScrollHint` appears at the bottom.
3. User scrolls → `ScrollHint` hides (via `scroll` event or IntersectionObserver).
4. `PortfolioGrid` displays projects responsively; the layout adapts automatically as the viewport changes.

## Responsive Behavior
- **Grid:** `auto‑fit` with `minmax(260px, 1fr)` ensures the grid fills the width and reduces columns on narrower viewports (single column under 768 px).
- **ScrollHint:** Always centered; hidden after first scroll.
- **ThreeBackground:** Canvas always covers the viewport; resizes on window changes.

## Testing Checklist
- [ ] Verify grid shows 3+ columns on wide screens and collapses correctly on mobile.
- [ ] Confirm scroll hint disappears after first scroll.
- [ ] Ensure Three.js loads from CDN without errors and the sphere animates smoothly.
- [ ] Check that the IntersectionObserver (if added) correctly hides the hint when the grid appears.

## Acceptance Criteria
- No layout shift when resizing the browser.
- Scroll hint is invisible after the first scroll.
- The mandala visual renders correctly on all modern browsers.
- All components compile without TypeScript or Astro errors.

*Spec self‑review:* No placeholders, consistent terminology, and all requirements are concrete.
