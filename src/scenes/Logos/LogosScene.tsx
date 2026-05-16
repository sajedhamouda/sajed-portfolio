import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

/**
 * Logos — Cinematic institutional trust layer.
 *
 * Two-tier hierarchy:
 *   Tier 1 (PRIMARY): Core tools — highest opacity, largest type
 *   Tier 2 (SECONDARY): Supporting tools — reduced opacity, smaller type
 *
 * Each item staggers in with a different delay — not uniform, not carousel.
 * The breathing animation uses staggered CSS keyframe delays so no two
 * items pulse at the same moment — organic, institutional, alive.
 *
 * Stats row below serves as the "credibility anchor" — the weight
 * that makes the tools row feel earned, not decorative.
 */

interface Tool {
  name: string;
  role: string;
  tier: 1 | 2;
}

const TOOLS: Tool[] = [
  // Tier 1 — primary expertise, highest visual weight
  { name: 'Wix',     role: 'Certified Partner',  tier: 1 },
  { name: 'Figma',   role: 'UI/UX Design',        tier: 1 },
  { name: 'Webflow', role: 'Development',          tier: 1 },
  // Tier 2 — supporting, lower visual weight
  { name: 'Adobe',   role: 'Creative Suite',       tier: 2 },
  { name: 'Framer',  role: 'Prototyping',           tier: 2 },
  { name: 'GSAP',    role: 'Animation',             tier: 2 },
];

const STATS = [
  { value: '200+', label: 'Projects delivered' },
  { value: '8',    label: 'Countries served' },
  { value: '6+',   label: 'Years practice' },
  { value: 'UAE',  label: 'Based in' },
];

export function LogosScene() {
  return (
    <SceneWrapper sceneId="logos" className="scene-layer logos-layer">
      {(state) => <LogosContent state={state} />}
    </SceneWrapper>
  );
}

function LogosContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('logos');
  const reg = SCENE_REGISTRY.logos;
  void Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isInactive  = state === 'inactive';
  const isSecondary = state === 'secondary';

  const opacity = isInactive ? 0 : isSecondary ? 0.3 : 1;
  const blurPx  = isInactive ? 8 : isSecondary ? 3 : 0;
  const scale   = isInactive ? 0.97 : isSecondary ? 0.99 : 1;

  return (
    <div
      className="logos-wrap"
      style={{
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: `scale(${scale})`,
        transition: 'opacity 1.72s cubic-bezier(0.16,1,0.3,1), filter 2.04s cubic-bezier(0.25,1,0.3,1), transform 2.28s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div className="section-eyeline logos-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">TOOLS &amp; PLATFORMS</span>
        <span className="eyeline-dash" />
      </div>

      <p className="logos-headline">
        Trusted expertise across the full stack of modern web.
      </p>

      {/* Institutional tools grid — two tiers, staggered reveal */}
      <div className="trust-tools">
        {TOOLS.map((tool, i) => (
          <div
            key={tool.name}
            className={`trust-tool trust-tool--t${tool.tier}`}
            style={{
              // Non-uniform stagger: primes-ish spacing prevents uniform pulse
              animationDelay: `${i * 0.37}s`,
              transform: state === 'primary' ? 'translateY(0px)' : 'translateY(14px)',
              transition: `transform 0.8s cubic-bezier(0.16,1,0.3,1)`,
              transitionDelay: state === 'primary' ? `${i * 70}ms` : '0ms',
            }}
          >
            <span className="trust-tool-name">{tool.name}</span>
            <span className="trust-tool-role">{tool.role}</span>
          </div>
        ))}
      </div>

      {/* Separator line — visual DNA element */}
      <div className="logos-sep" />

      {/* Credibility stats — the weight that makes the tools feel earned */}
      <div className="trust-stats">
        {STATS.map((s) => (
          <div key={s.label} className="trust-stat">
            <span className="trust-stat-value">{s.value}</span>
            <span className="trust-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
