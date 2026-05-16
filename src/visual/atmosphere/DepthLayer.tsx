import { useEffect, useState } from 'react';
import { SceneController } from '../../core/scene-engine/SceneController';

/**
 * DepthLayer — Cinematic blur planes + gradient blinds.
 *
 * Renders three atmospheric overlays:
 *   1. Top vignette — dark radial gradient that intensifies in mid-scroll
 *   2. Bottom vignette — scene-separator blur edge
 *   3. Horizontal gradient blind — slow-moving light plane that
 *      drifts downward as scroll progresses (cinematic depth cue)
 *
 * ALL rendering is pure CSS + opacity/transform (GPU only).
 * Zero canvas fills per frame. Scroll progress updates at ~60fps
 * via SceneController subscriber but only drives CSS custom properties
 * on the root element — no layout or paint triggered.
 */
export function DepthLayer() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = SceneController.subscribe(() => {
      setProgress(SceneController.getScrollProgress());
    });
    return unsub;
  }, []);

  // Blind drifts from top to bottom as user scrolls
  // Range: -30vh (top-hidden) → +80vh (bottom-hidden)
  const blindY = -30 + progress * 110; // vh units

  // Mid-scroll vignette intensifies then fades
  // Peak at progress=0.5
  const vigIntensity = Math.sin(progress * Math.PI); // 0→1→0

  return (
    <>
      {/* ── Top vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,0,0,0.55) 0%, transparent 70%)`,
          opacity: 0.6 + vigIntensity * 0.2,
          transition: 'opacity 2.1s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'opacity',
        }}
      />

      {/* ── Bottom vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 100% 50% at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 65%)`,
          opacity: 0.5 + vigIntensity * 0.25,
          transition: 'opacity 2.7s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'opacity',
        }}
      />

      {/* ── Gradient blind — cinematic horizontal light plane ── */}
      {/* A very thin horizontal gradient that slowly drifts down the page,
          simulating a cinematic lighting pass — barely perceptible. */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          width: '100%',
          height: '35vh',
          zIndex: 3,
          pointerEvents: 'none',
          // Transform only — GPU composited, no paint
          transform: `translateY(${blindY}vh)`,
          transition: 'transform 3.5s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform',
          background: `linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 240, 255, 0.018) 30%,
            rgba(0, 200, 255, 0.032) 50%,
            rgba(0, 240, 255, 0.018) 70%,
            transparent 100%
          )`,
          // Subtle horizontal variation for non-uniform feel
          maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      />

      {/* ── Edge side vignettes — lateral depth ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          background: `linear-gradient(
            to right,
            rgba(0,0,0,0.4) 0%,
            transparent 18%,
            transparent 82%,
            rgba(0,0,0,0.4) 100%
          )`,
          opacity: 0.7,
        }}
      />
    </>
  );
}
