import { useEffect, useState } from 'react';
import { SceneController } from '../../core/scene-engine/SceneController';

/**
 * HeroSignature — Cinematic identity frame for the Hero scene.
 *
 * Adds three pure-CSS atmospheric layers BEHIND the hero content:
 *   1. Scanline texture   — SVG repeating lines, ~2% opacity, static
 *   2. Optical focus zone — radial brightness concentration behind typography
 *   3. Corner brackets    — four 20px L-shaped corners framing the scene
 *
 * Rendered as a fixed overlay, z-index 9 (above Three.js z:1, below hero content z:10).
 * The scanline and focus zone fade out as the user scrolls past Hero,
 * so they do not compete with subsequent scenes. Corner brackets follow suit.
 * Zero JS per frame after the initial fade subscription.
 */
export function HeroSignature() {
  // Track hero scroll progress to fade signature layers as user scrolls away
  const [sigOpacity, setSigOpacity] = useState(1);

  useEffect(() => {
    const unsub = SceneController.subscribe(() => {
      const p = SceneController.getScrollProgress();
      // Hero range: 0.0–0.15. Fade signature out between 0.10–0.22.
      const fadeStart = 0.10;
      const fadeEnd   = 0.22;
      const opacity = p <= fadeStart ? 1
        : p >= fadeEnd ? 0
        : 1 - (p - fadeStart) / (fadeEnd - fadeStart);
      setSigOpacity(Math.max(0, Math.min(1, opacity)));
    });
    return unsub;
  }, []);

  return (
    <>
      {/* ── Scanline texture ── */}
      {/* A repeating SVG of 1px horizontal lines at 4px intervals */}
      {/* Opacity 0.025 — felt architecturally, invisible consciously */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='4'%3E%3Cline x1='0' y1='0' x2='100%25' y2='0' stroke='rgba(255,255,255,0.06)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '100% 4px',
          opacity: sigOpacity,
          mixBlendMode: 'overlay',
          transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity',
        }}
      />

      {/* ── Optical focus zone ── */}
      {/* Soft brightness concentration: the eye is drawn to center-left where the name lives */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9,
          pointerEvents: 'none',
          background: `radial-gradient(
            ellipse 55% 45% at 38% 48%,
            rgba(255,255,255,0.025) 0%,
            rgba(0,240,255,0.012) 35%,
            transparent 70%
          )`,
          opacity: sigOpacity,
          transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity',
        }}
      />

      {/* ── Corner bracket frame ── */}
      {/* Four L-shaped optical brackets framing the scene — architectural framing language */}
      <div
        aria-hidden="true"
        className="hero-sig-frame"
        style={{
          position: 'fixed',
          inset: '32px',
          zIndex: 9,
          pointerEvents: 'none',
          opacity: sigOpacity,
          transition: 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'opacity',
        }}
      />
    </>
  );
}
