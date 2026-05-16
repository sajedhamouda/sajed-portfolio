import { useEffect, useRef, useState } from 'react';
import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import { usePointer } from '../../core/interaction/usePointer';
import { PointerEngine } from '../../core/interaction/PointerEngine';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

export function HeroScene() {
  return (
    <SceneWrapper sceneId="hero" className="scene-layer hero-layer">
      {(state) => <HeroContent state={state} />}
    </SceneWrapper>
  );
}

function HeroContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('hero');
  const reg = SCENE_REGISTRY.hero;
  const local = Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isPrimary  = state === 'primary';
  const isSecondary = state === 'secondary';
  const isInactive  = state === 'inactive';

  // Entry-relative reveal: hero wakes up 200ms after the cinematic-entry event
  // fires (i.e., 200ms after the loader begins to fade and the app becomes
  // visible). A short head-start lets the atmosphere (DotGrid, depth layers)
  // begin resolving before the hero typography fades in — but not so long
  // that the user is staring at an empty black screen.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onEntry = () => { t = setTimeout(() => setEntered(true), 200); };
    window.addEventListener('cinematic-entry', onEntry, { once: true });
    return () => {
      window.removeEventListener('cinematic-entry', onEntry);
      clearTimeout(t);
    };
  }, []);

  // Until cinematic-entry fires + 480ms delay: hero is opacity 0, blurred
  const wrapOpacity = !entered ? 0 : isInactive ? 0 : isSecondary ? 0.25 : 1;
  const parallaxY   = local * -40;
  const blurPx      = !entered ? 10 : isInactive ? 8 : isSecondary ? 3 : 0;
  const scalePx     = isPrimary ? 1 : 1.015;

  // Refs for direct DOM manipulation — no React re-render per frame
  const firstRef = useRef<HTMLSpanElement>(null);
  const lastRef  = useRef<HTMLSpanElement>(null);
  const metaRef  = useRef<HTMLDivElement>(null);

  // Step 3: Cinematic lens depth — two planes moving in opposite micro-directions
  // SAJED (foreground): moves slightly toward cursor — max 8px
  // HAMOUDA (background): moves slightly away from cursor — max 5px
  // Sub-title row: barely moves — max 3px
  usePointer((ptr) => {
    const intensity = PointerEngine.sceneIntensity('hero');
    if (intensity === 0) return;

    const { cx, cy } = ptr; // -1 to +1

    const fgX = cx * 8  * intensity;
    const fgY = cy * 5  * intensity;
    const bgX = cx * -5 * intensity;
    const bgY = cy * -3 * intensity;
    const mtX = cx * 2  * intensity;
    const mtY = cy * 1.5 * intensity;

    if (firstRef.current) {
      firstRef.current.style.transform = `translate(${fgX}px, ${fgY}px)`;
    }
    if (lastRef.current) {
      lastRef.current.style.transform = `translate(${bgX}px, ${bgY}px)`;
    }
    if (metaRef.current) {
      metaRef.current.style.transform = `translate(${mtX}px, ${mtY}px)`;
    }
  });

  return (
    <div
      className="hero-wrap"
      style={{
        opacity: wrapOpacity,
        filter: `blur(${blurPx}px)`,
        transform: `translateY(${parallaxY}px) scale(${scalePx})`,
        transition: 'opacity 1.32s cubic-bezier(0.16,1,0.3,1), filter 1.56s cubic-bezier(0.25,1,0.3,1), transform 1.74s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Eye-line label */}
      <div className="hero-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">WIX CERTIFIED DESIGNER · UI/UX SPECIALIST</span>
        <span className="eyeline-dash" />
      </div>

      {/* Display name — two-plane depth separation */}
      <h1 className="hero-display">
        {/* Foreground plane — moves toward cursor */}
        <span
          ref={firstRef}
          className="hero-first"
          style={{ willChange: 'transform', display: 'block' }}
        >
          SAJED
        </span>
        {/* Background plane — moves away, creates lens depth illusion */}
        <span
          ref={lastRef}
          className="hero-last"
          style={{ willChange: 'transform', display: 'block' }}
        >
          HAMOUDA
        </span>
      </h1>

      {/* Sub-identity — barely moves */}
      <div ref={metaRef} style={{ willChange: 'transform' }}>
        <p className="hero-identity">Founder, Da Vinci Studio &nbsp;·&nbsp; Abu Dhabi, UAE</p>

        <div className="hero-availability">
          <span className="avail-dot" />
          <span className="avail-label">Available for new projects</span>
        </div>

        <p className="hero-descriptor">
          Precision digital experiences for brands that cannot afford
          to look like everything else — crafted in the UAE.
        </p>
      </div>

      {/* Scroll prompt */}
      <div className="hero-scroll-hint" style={{ opacity: isPrimary && local < 0.3 ? 1 : 0 }}>
        <span className="scroll-line" />
        <span className="scroll-text">SCROLL</span>
      </div>
    </div>
  );
}
