import { useEffect, useRef } from 'react';
import { PointerEngine } from '../../core/interaction/PointerEngine';

/**
 * CursorField — Soft radial light source following the cursor.
 *
 * Renders a single fixed div whose background is a radial gradient
 * centered at the cursor position. On each RAF frame the div's
 * background-position is updated — ONE style write per frame,
 * GPU-composited via background-position (no layout).
 *
 * Actually we use transform: translate() on a child div which is
 * cheaper than re-evaluating a gradient. The child is large enough
 * that its edges never show within the viewport.
 *
 * Layer: z-index 3 (same level as DepthLayer vignettes — atmospheric)
 * Opacity: extremely low — 2–5% max
 */
export function CursorField() {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No-op on coarse-pointer (touch) devices — cursor decorations are irrelevant.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const unsub = PointerEngine.subscribe((state) => {
      if (!innerRef.current) return;
      // Translate the radial gradient center to cursor position.
      // The inner div is 200vw × 200vh, starts at -50vw/-50vh so
      // its center aligns with viewport center at translate(0,0).
      // We shift it so the gradient center = cursor position.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tx = state.x - vw * 0.5;
      const ty = state.y - vh * 0.5;
      // Direct DOM write on the already-composited element — no React rerender
      innerRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      // Fade in/out based on active state
      innerRef.current.style.opacity = state.active ? '1' : '0';
    });
    return unsub;
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          // Large enough to always cover the viewport regardless of cursor position
          width: '200vw',
          height: '200vh',
          top: '-50vh',
          left: '-50vw',
          background: `radial-gradient(
            ellipse 40% 40% at 50% 50%,
            rgba(0, 224, 255, 0.028) 0%,
            rgba(0, 180, 220, 0.014) 35%,
            transparent 70%
          )`,
          willChange: 'transform',
          opacity: 0,
          transition: 'opacity 2.6s cubic-bezier(0.16, 1, 0.3, 1)',
          // No pointer-events, no layout impact
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
