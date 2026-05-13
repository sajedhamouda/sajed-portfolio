import { useRef } from 'react';
import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import { usePointer } from '../../core/interaction/usePointer';
import { PointerEngine } from '../../core/interaction/PointerEngine';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

export function CTAScene() {
  return (
    <SceneWrapper sceneId="cta" className="scene-layer cta-layer">
      {(state) => <CTAContent state={state} />}
    </SceneWrapper>
  );
}

function CTAContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('cta');
  const reg = SCENE_REGISTRY.cta;
  void Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isInactive  = state === 'inactive';
  const isSecondary = state === 'secondary';

  const opacity    = isInactive ? 0 : isSecondary ? 0.3 : 1;
  const blurPx     = isInactive ? 10 : isSecondary ? 4 : 0;
  const translateY = isInactive ? 60 : isSecondary ? 25 : 0;

  // Step 5: Refs for button micro-lift — imperative DOM, no React re-render
  const primaryBtnRef   = useRef<HTMLAnchorElement>(null);
  const secondaryBtnRef = useRef<HTMLAnchorElement>(null);
  const headlineRef     = useRef<HTMLHeadingElement>(null);

  // Subtle depth elevation: cursor proximity to button area lifts it
  // Lift is computed from cursor Y position relative to viewport center
  // Max lift: 3px — architectural weight, not bounce
  usePointer((ptr) => {
    const intensity = PointerEngine.sceneIntensity('cta');
    if (intensity === 0) return;

    // Cursor above vertical center → slight lift; below → slight push
    const liftY = ptr.cy * -3 * intensity;
    // Headline barely reacts — depth cue only
    const hdY   = ptr.cy * -1.5 * intensity;
    const hdX   = ptr.cx * 2 * intensity;

    if (primaryBtnRef.current) {
      primaryBtnRef.current.style.transform = `translateY(${liftY}px)`;
    }
    if (secondaryBtnRef.current) {
      // Secondary lifts a touch less than primary — depth hierarchy
      secondaryBtnRef.current.style.transform = `translateY(${liftY * 0.65}px)`;
    }
    if (headlineRef.current) {
      headlineRef.current.style.transform = `translate(${hdX}px, ${hdY}px)`;
    }
  });

  return (
    <div
      className="cta-wrap"
      style={{
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 1.88s cubic-bezier(0.16,1,0.3,1), filter 2.16s cubic-bezier(0.25,1,0.3,1), transform 2.36s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Closing narrative line */}
      <div className="section-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">LET'S BUILD SOMETHING</span>
        <span className="eyeline-dash" />
      </div>

      {/* Headline — subtle spatial response */}
      <h2
        ref={headlineRef}
        className="cta-headline"
        style={{ willChange: 'transform' }}
      >
        Your brand deserves<br />
        <em className="cta-em">to be seen.</em>
      </h2>

      <p className="cta-sub">
        I take a limited number of new clients at a time.
        If your project deserves attention, let's talk now.
      </p>

      {/* Action row — buttons feel heavy and intentional */}
      <div className="cta-actions">
        <a
          ref={primaryBtnRef}
          href="mailto:sajed@davincistudio.ae"
          className="cta-btn-primary"
          style={{ willChange: 'transform' }}
        >
          Start a Project
        </a>
        <a
          ref={secondaryBtnRef}
          href="https://wa.me/971501234567"
          className="cta-btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
          style={{ willChange: 'transform' }}
        >
          WhatsApp me
        </a>
      </div>

      {/* Availability note */}
      <div className="cta-availability">
        <span className="avail-dot" />
        <span className="avail-label">Currently accepting new projects</span>
      </div>

      {/* Footer micro line */}
      <div className="cta-footer">
        <span>© 2025 Da Vinci Studio</span>
        <span className="cta-footer-sep">·</span>
        <span>Abu Dhabi, UAE</span>
        <span className="cta-footer-sep">·</span>
        <a href="https://linkedin.com/in/sajed" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  );
}
