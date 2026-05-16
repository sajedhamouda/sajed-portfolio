import { useEffect, useRef } from 'react';

/**
 * DotGrid — Atmospheric background layer.
 *
 * Renders an extremely subtle dot grid that drifts imperceptibly slow,
 * creating spatial depth without distracting from content.
 *
 * Performance notes:
 * - Draws to a single OffscreenCanvas (or regular canvas) once, then
 *   CSS-translates the element on RAF — zero per-frame pixel fills.
 * - Only transform + opacity on the DOM element (GPU composited).
 * - Caps drift speed at ~0.008 px/frame — imperceptible to the eye.
 */
export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // We render a tile 3× the viewport so we can drift inside it
    // without ever exposing an edge.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const TILE = 3; // tile multiplier
    let vpW = window.innerWidth;
    let vpH = window.innerHeight;

    const DOT_SPACING = 28; // px between dots
    const DOT_RADIUS  = 1;  // px dot radius
    const DOT_OPACITY = 0.18; // max dot alpha

    /** Draw the static dot grid onto the canvas once */
    function drawGrid() {
      const w = vpW * TILE;
      const h = vpH * TILE;
      canvas!.width  = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width  = `${w}px`;
      canvas!.style.height = `${h}px`;

      const ctx = canvas!.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = `rgba(0, 240, 255, ${DOT_OPACITY})`;

      for (let x = DOT_SPACING / 2; x < w; x += DOT_SPACING) {
        for (let y = DOT_SPACING / 2; y < h; y += DOT_SPACING) {
          // Very slight radial fade from center so edges feel deeper
          const dx = (x / w) - 0.5;
          const dy = (y / h) - 0.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const alpha = DOT_OPACITY * (1 - dist * 0.9);

          ctx.globalAlpha = Math.max(0, alpha);
          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    drawGrid();

    // Start the tile at the center so we have equal drift room on all sides
    let offsetX = -vpW;
    let offsetY = -vpH;

    // Drift direction — very slow angular drift, changes negligibly
    let angle  = Math.random() * Math.PI * 2;
    const SPEED = 0.012; // px per frame at 60fps ≈ 0.72 px/s
    let rafId: number;

    const tick = () => {
      // Imperceptibly slow drift — angle nudges every 400 frames
      angle += 0.0004;
      offsetX += Math.cos(angle) * SPEED;
      offsetY += Math.sin(angle) * SPEED;

      // Wrap within ±vpW / ±vpH so edges never show
      if (offsetX > 0)    offsetX = -vpW;
      if (offsetX < -vpW * 1.999) offsetX = -vpW;
      if (offsetY > 0)    offsetY = -vpH;
      if (offsetY < -vpH * 1.999) offsetY = -vpH;

      // GPU-composited transform only — no pixel fill per frame
      canvas!.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const handleResize = () => {
      vpW = window.innerWidth;
      vpH = window.innerHeight;
      offsetX = -vpW;
      offsetY = -vpH;
      drawGrid();
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,           // behind Three.js canvas (z:1) and all scene layers
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
}
