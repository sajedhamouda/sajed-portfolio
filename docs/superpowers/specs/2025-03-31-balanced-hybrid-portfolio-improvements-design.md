# Balanced Hybrid Portfolio Improvements - Design Specification

**Date:** 2025-03-31
**Project:** Sajed Portfolio
**Approach:** Balanced Hybrid (C) - 80% engagement, 50% performance cost
**Status:** Approved

---

## 1. Goals & Success Criteria

### Primary Goals
1. **Increase Visitor Engagement** - Capture attention within 3 seconds, encourage page exploration
2. **Showcase Work Effectively** - Make content instantly scannable and visually impactful
3. **Improve Loading Speed** - Target sub-1s Time to Interactive (TTI)

### Success Metrics
- Time to Interactive: <800ms (current ~2.1s)
- Total bundle size: <500KB (current ~1.2MB)
- Lighthouse Performance score: 90+ (current ~68)
- Engagement rate: +30% (measured via scroll depth and interaction events)

---

## 2. Architecture & Component Structure

### Current State
- Astro 6.1.1 project with TypeScript
- Components in `src/components/`
- Three.js background (180KB, r128)
- Existing components:
  - NumberedCards.astro (has hover effects)
  - Timeline.astro (has scroll animations)
  - PortfolioGrid.astro
  - Counters.astro
  - ScrollHint.astro
  - ThreeBackground.astro (to be removed)
  - Legacy components in `src/components/old/`

### Proposed Architecture Changes

**1. Replace ThreeBackground with CSS Gradient**
- Remove `src/components/ThreeBackground.astro` completely
- Add background to main layout or hero component
- Eliminates 180KB JavaScript dependency
- Improves TTI by ~600ms

**2. Create Animation Utilities Module**
- New file: `src/utils/animations.js`
- Export reusable IntersectionObserver patterns
- Centralize animation configuration (durations, easing, thresholds)

**3. Component Optimization Strategy**
- PortfolioGrid: lazy load with `client:load` directive
- Counters: lazy load with `client:load` (only animates when visible)
- All scroll-animated components use shared utility

**4. Cleanup**
- Remove unused components in `src/components/old/`
- Consolidate duplicate component versions

---

## 3. Scroll Animations

### Implementation Pattern

Create shared utility `src/utils/animations.js`:

```javascript
// Scroll animation configuration
const ANIMATION_CONFIG = {
  duration: '0.6s',
  easing: 'ease-out',
  threshold: 0.15,
  rootMargin: '0px 0px -50px 0px'
};

// Generic visibility observer
export const observeVisibility = (elements, className = 'visible', delay = 0) => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (mediaQuery.matches) {
          entry.target.classList.add(className); // No delay for reduced motion
        } else {
          setTimeout(() => {
            entry.target.classList.add(className);
          }, delay);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: ANIMATION_CONFIG.threshold });

  elements.forEach(el => observer.observe(el));
};

// Staggered animation helper
export const staggerAnimate = (selector, staggerDelay = 100) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.transitionDelay = `${i * staggerDelay}ms`;
  });
  observeVisibility(elements);
};
```

### Component-Specific Animations

**1. NumberedCards**
- Staggered fade-in: cards appear one by one
- Stagger delay: 100ms between cards
- Initial state: opacity 0, translateY(20px)
- Target state: opacity 1, translateY(0)
- CSS:
  ```css
  .card {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  .card.visible {
    opacity: 1;
    transform: translateY(0);
  }
  ```

**2. PortfolioGrid**
- Row-based staggered animation
- Stagger delay: 50ms between cards
- Same opacity/transform pattern as NumberedCards

**3. Counters**
- Number count-up animation when visible
- Duration: 1.5s ease-out
- Use requestAnimationFrame for smooth counting
- Initial: 0, Target: final number
- Format: add comma separators for thousands

**4. Hero Section**
- Title: fade-in with upward movement (translateY(30px) → 0, 0.8s)
- Subtitle: fade-in with 200ms delay after title
- CTA buttons: fade-in with 400ms delay
- Optional: parallax effect on background if CSS gradient used

**5. Scroll Progress Indicator**
- Fixed position at top: `position: fixed; top: 0; left: 0;`
- Height: 4px; background: #e63030; z-index: 10000
- Width updates on scroll: `width: ${scrollPercent}%`
- Throttle scroll handler to 100ms using requestAnimationFrame
- Respect `prefers-reduced-motion: reduce` with media query to disable animation

---

## 4. Hover Effects

### PortfolioGrid Cards

**Enhanced CSS:**
```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  will-change: transform, box-shadow;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  background: #1a1a1a;
}

.card-image-wrapper {
  overflow: hidden;
}

.card img {
  transition: transform 0.4s ease;
  will-change: transform;
}

.card:hover img {
  transform: scale(1.05);
}

.card-overlay {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover .card-overlay {
  opacity: 1;
}
```

**Overlay content:**
- Semi-transparent black background (rgba(0,0,0,0.7))
- View Project button with hover state
- Category tags visible on hover

### NumberedCards

Current hover already good, add:
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  background: #1a1a1a; /* instead of #111111 */
}
```

### Timeline

```css
.timeline-content {
  transition: border-left 0.3s ease, background 0.3s ease, transform 0.3s ease;
  border-left: 3px solid transparent;
}

.timeline-content:hover {
  border-left-color: #e63030;
  background: #1a1a1a;
  transform: translateX(4px);
}

.timeline-dot {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.timeline-item:hover .timeline-dot {
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(230, 48, 48, 0.2);
}
```

### ScrollHint Component

Ensure subtle pulse animation:
```css
@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(5px); }
}

.scroll-hint {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 5. Performance Optimization

### 1. Remove Three.js Background

**Action:** Delete `src/components/ThreeBackground.astro`

**Replacement CSS:** Add to global styles or Layout.astro

```css
.hero-background {
  min-height: 100vh;
  background:
    radial-gradient(circle at 30% 20%, rgba(230, 48, 48, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 70% 80%, rgba(46, 139, 192, 0.08) 0%, transparent 40%),
    linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%);
  position: relative;
}

.hero-background::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23222' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}
```

**Impact:** Saves 180KB, no JS execution, improves LCP by ~600ms

### 2. Image Optimization

**Use Astro's built-in Image component:**

```astro
import { Image } from 'astro:assets';

<Image
  src={project.image}
  alt={project.title}
  width={800}
  height={600}
  formats={['webp', 'avif']}
  loading="lazy"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Requirements:**
- Store images in `src/assets/images/` or external with proper CORS
- Add image optimization middleware in `astro.config.mjs`
- Use responsive breakpoints

### 3. Font Optimization

**Current fonts:** 'Bebas Neue', 'Outfit' (likely from Google Fonts)

**Optimization steps:**
1. Add `font-display: swap` to all @import statements
2. Preconnect to Google Fonts:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   ```
3. Optional: Self-host fonts for faster TTFB (adds 50-80KB but removes third-party request)

**CSS:**
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;600&display=swap');
```

### 4. Code Splitting & Lazy Loading

**PortfolioGrid.astro:**
```astro
<div client:load>
  <!-- Grid content here -->
</div>
```

**Counters.astro:**
```astro
<div client:load>
  <!-- Counter content -->
</div>
```

**Effect:** Components only load when needed, reduces initial bundle

### 5. Bundle Size Targets

- Current: ~1.2MB (with Three.js)
- After optimizations: ~500KB
  - Remove Three.js: -180KB
  - Image optimization & lazy loading: -320KB
  - Code splitting: -150KB
  - Font optimization: -20KB
  - CSS minification & tree-shaking: -30KB

---

## 6. Content & UX Improvements

### 1. Scroll Progress Indicator

**Implementation:**

Add to Layout.astro head or as fixed component:

```astro
---
// Layout.astro or separate component
---

<div id="scroll-progress" style="
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: #e63030;
  width: 0%;
  z-index: 10000;
  transition: width 100ms ease-out;
"></div>

<script>
  const progressBar = document.getElementById('scroll-progress');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${scrollPercent}%`;
        ticking = false;
      });
      ticking = true;
    }
  });
</script>
```

### 2. Project Detail Modal

**Component: src/components/ProjectModal.astro**

```astro
---
interface Props {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}
const { project, isOpen, onClose } = Astro.props;
---

<div class={`modal ${isOpen ? 'open' : ''}`} onClick={onClose}>
  <div class="modal-content" onClick={(e) => e.stopPropagation()}>
    <button class="close-btn" onclick={onClose}>×</button>
    <img src={project.fullImage} alt={project.title} />
    <h2>{project.title}</h2>
    <p class="category">{project.category}</p>
    <div class="description">{project.fullDescription}</div>
    <a href={project.link} class="view-live">View Live Project →</a>
  </div>
</div>

<style>
  .modal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 9999;
  }
  .modal.open {
    opacity: 1;
    pointer-events: auto;
  }
  .modal-content {
    background: #111111;
    border: 1px solid #222222;
    max-width: 900px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    transform: scale(0.95);
    transition: transform 0.2s ease;
  }
  .modal.open .modal-content {
    transform: scale(1);
  }
  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #f0ede6;
    font-size: 2rem;
    cursor: pointer;
  }
</style>
```

**Usage in PortfolioGrid:**
```astro
<script>
  let selectedProject = null;
  function openModal(project) {
    selectedProject = project;
  }
  function closeModal() {
    selectedProject = null;
  }
</script>

{#each projects as project (project.id)}
  <div class="card" onclick={() => openModal(project)}>
    <!-- card content -->
  </div>
{/each}

{#if selectedProject}
  <ProjectModal project={selectedProject} isOpen={true} onClose={closeModal} />
{/if}
```

### 3. Category Filter for PortfolioGrid

**Filter Implementation:**

```astro
---
interface Props {
  projects: Project[];
}
const { projects } = Astro.props;
const categories = ['All', 'Web Design', 'Branding', 'UI/UX'];

// Astro can't handle state, so this will be client-side
---
<div class="filter-container">
  {categories.map(cat => (
    <button
      class={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
      onclick={() => activeFilter = cat}
    >
      {cat}
    </button>
  ))}
</div>

<div class="portfolio-grid">
  {projects.filter(p => activeFilter === 'All' || p.category === activeFilter).map(...)}
</div>

<script>
  let activeFilter = 'All';
</script>

<style>
  .filter-container {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .filter-btn {
    background: transparent;
    border: 1px solid #222222;
    color: #888888;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Outfit', sans-serif;
  }
  .filter-btn:hover {
    border-color: #e63030;
    color: #f0ede6;
  }
  .filter-btn.active {
    background: #e63030;
    border-color: #e63030;
    color: white;
  }
</style>
```

### 4. Navigation Improvements

**Smooth Scroll:**
```javascript
// In global script
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        duration: 800 // Not standard, use polyfill or custom scroll
      });
    }
  });
});
```

**Active Section Highlighting:**
```javascript
// Use IntersectionObserver to detect active section
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.classList.add('active');
        }
      });
    }
  });
}, { threshold: 0.5 });

sections.forEach(section => observer.observe(section));
```

---

## 7. Technical Specifications

### CSS Variables Theme

Add to global styles:

```css
:root {
  --color-primary: #e63030;
  --color-secondary: #2e8bc0;
  --color-bg: #0a0a0a;
  --color-bg-alt: #111111;
  --color-text: #f0ede6;
  --color-text-muted: #888888;
  --color-border: #222222;

  --animation-duration: 0.6s;
  --animation-easing: ease-out;
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;

  --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-md: 0 8px 16px rgba(0,0,0,0.3);
  --shadow-lg: 0 12px 24px rgba(0,0,0,0.4);

  --radius: 4px;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 3rem;
}
```

### Performance Monitoring

Add to Layout.astro:

```html
<script>
  // Web Vitals tracking (optional)
  import { getCLS, getFID, getLCP } from 'web-vitals';

  getCLS(console.log);
  getFID(console.log);
  getLCP(console.log);
</script>
```

---

## 8. Implementation Phases

### Phase 1: Foundation Changes (Day 1-2)
1. Remove ThreeBackground component completely
2. Add CSS gradient background to Layout.astro or hero section
3. Create `src/utils/animations.js` with shared utilities
4. Implement scroll progress indicator
5. Clean up `src/components/old/` folder

### Phase 2: Scroll Animations (Day 3)
1. Apply staggered animations to NumberedCards
2. Apply staggered animations to PortfolioGrid
3. Implement counter count-up animation
4. Add hero section entrance animations
5. Test animations on all viewport sizes

### Phase 3: Hover Effects (Day 4)
1. Enhance PortfolioGrid card hover (lift + shadow + zoom)
2. Update NumberedCards hover (add lift + shadow)
3. Add timeline hover effects (border + dot scale)
4. Ensure ScrollHint pulse animation works
5. Test on mobile (hover disabled by default)

### Phase 4: Image & Asset Optimization (Day 5)
1. Install Astro image integration: `npx astro add image`
2. Convert images to WebP format
3. Implement responsive Image component in PortfolioGrid
4. Add lazy loading to below-the-fold images
5. Test image quality and sizes

### Phase 5: Interactive Features (Day 6)
1. Create ProjectModal.astro component
2. Implement modal open/close with backdrop
3. Add category filter to PortfolioGrid
4. Wire up state management (simple Astro reactive state)
5. Test modal interactions on mobile

### Phase 6: Navigation & Polish (Day 7)
1. Implement smooth scrolling
2. Add active section highlighting
3. Add preconnect links for fonts in head
4. Add `font-display: swap` to all font imports
5. Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Phase 7: Performance Testing (Day 8)
1. Run Lighthouse audit
2. Check bundle size with `npm run build`
3. Test TTI using WebPageTest or Chrome DevTools
4. Optimize any remaining bottlenecks
5. Deploy to production

---

## 9. Testing Checklist

- [ ] All scroll animations trigger correctly
- [ ] Stagger delays work on all viewport sizes
- [ ] Hover effects don't cause jank (use will-change)
- [ ] Images load in WebP with fallback
- [ ] Lazy loading works for off-screen content
- [ ] Modal opens/closes smoothly
- [ ] Category filter updates grid instantly
- [ ] Scroll progress indicator accurate
- [ ] Smooth scroll navigation works
- [ ] Active nav link updates on section change
- [ ] No console errors
- [ ] Bundle size < 500KB gzipped
- [ ] Lighthouse Performance > 90
- [ ] TTI < 800ms on fast 3G simulation
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessible: keyboard navigation, ARIA labels, focus states

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Animations cause jank on low-end devices | Use will-change, test on actual devices, add prefers-reduced-motion media query |
| Image optimization breaks existing layouts | Test with placeholders first, implement fallbacks |
| Modal state management conflicts with Astro | Use simple client-side state, avoid server-side interaction |
| Three.js removal affects visual appeal | Ensure CSS gradient provides comparable aesthetic |
| Lazy loading causes layout shifts | Add placeholder heights/widths |
| Bundle size still too high | Implement additional code splitting, audit dependencies |

---

## 11. Future Enhancements (Post-Launch)

- A/B test different animation styles
- Add dark/light theme toggle
- Implement service worker for offline support
- Add search functionality for projects
- Integrate analytics to track scroll depth and engagement
- Create design system documentation
- Add skeleton loaders for better perceived performance

---

## 12. Summary

This balanced hybrid approach delivers:
- **High engagement** through scroll animations and hover effects
- **Effective showcase** with category filters and project modals
- **Fast performance** by removing Three.js and optimizing assets
- **Measurable results** with clear targets and testing plan

Total estimated implementation time: 7 days (can be parallelized)
Performance gain: ~750ms TTI improvement
Bundle size reduction: ~750KB
Lighthouse score improvement: 22 points (68 → 90+)

---

**Design Approved By:** User
**Design Document Created:** 2025-03-31
**Next Step:** Implementation planning via `superpowers:writing-plans` skill
