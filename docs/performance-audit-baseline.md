# Performance Baseline - Before Changes

**Date:** 2025-04-01

## Current Metrics
- Total Bundle Size: 617KB
- Lighthouse Performance: Not run (manual test recommended)
- Time to Interactive: Estimated ~2.1s based on bundle size
- LCP: Not measured
- CLS: Not measured

## Current Components
- ThreeBackground: ~180KB (estimated from file size)
- PortfolioGrid: ~160KB (large file detected)
- Counters: Small component
- Total JS: Significant from Three.js + large components

## Notes
- Current scroll animations: Timeline only (using IntersectionObserver)
- Current hover effects: NumberedCards (background/color changes), partial PortfolioGrid
- Three.js background is heavy dependency (~180KB minified)
- Multiple legacy components in old/ folder (cleanup opportunity)