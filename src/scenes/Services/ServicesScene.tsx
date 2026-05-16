import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

/**
 * Services — Magic Bento art-directed layout.
 *
 * Grid structure (asymmetric, editorial):
 *   ┌──────────────────────────┬──────────┐
 *   │  FEATURED: Web Design    │ UI/UX    │
 *   │  (wide, 2-col span)      │          │
 *   ├──────────┬───────────────┴──────────┤
 *   │  Brand   │  Motion & Interaction    │
 *   │  Identity│  (wide, 2-col span)      │
 *   └──────────┴──────────────────────────┘
 *
 * Each card has a `featured` flag that controls its bento size.
 * No color tiles, no loud hover, no floating — pure editorial restraint.
 */

interface Service {
  code: string;
  title: string;
  subtitle: string;
  body: string;
  featured?: boolean;
  stat?: string;
  statLabel?: string;
}

const SERVICES: Service[] = [
  {
    code: 'SVC-01',
    title: 'Web Design',
    subtitle: 'Wix · Webflow · Custom',
    body: 'Pixel-precise, brand-aligned websites built for performance and conversion. From concept to launch — every decision deliberate.',
    featured: true,
    stat: '200+',
    statLabel: 'Projects Delivered',
  },
  {
    code: 'SVC-02',
    title: 'UI/UX Design',
    subtitle: 'Figma · Prototyping · Research',
    body: 'Interface systems designed around how real users think — not how designers wish they did.',
  },
  {
    code: 'SVC-03',
    title: 'Brand Identity',
    subtitle: 'Logo · Typography · System',
    body: 'Visual identities with authority. Built to own a niche and hold it for a decade.',
  },
  {
    code: 'SVC-04',
    title: 'Motion & Interaction',
    subtitle: 'CSS · RAF · First principles',
    body: 'Purposeful animation that guides attention. No decoration — only signal.',
    featured: true,
  },
];

export function ServicesScene() {
  return (
    <SceneWrapper sceneId="services" className="scene-layer services-layer">
      {(state) => <ServicesContent state={state} />}
    </SceneWrapper>
  );
}

function ServicesContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('services');
  const reg = SCENE_REGISTRY.services;
  const local = Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isInactive  = state === 'inactive';
  const isSecondary = state === 'secondary';

  const opacity    = isInactive ? 0 : isSecondary ? 0.3 : 1;
  const translateY = isInactive ? 50 : isSecondary ? 30 - local * 50 : 0;
  const blurPx     = isInactive ? 10 : isSecondary ? 4 : 0;

  return (
    <div
      className="services-wrap"
      style={{
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 1.48s cubic-bezier(0.16,1,0.3,1), filter 1.76s cubic-bezier(0.25,1,0.3,1), transform 1.92s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div className="section-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">SERVICES</span>
      </div>

      <h2 className="services-headline">What I build</h2>

      {/* Bento grid — asymmetric editorial layout */}
      <div className="bento-grid">
        {SERVICES.map((svc, i) => (
          <div
            key={svc.code}
            className={`bento-card${svc.featured ? ' bento-card--featured' : ''}`}
            style={{
              opacity: state === 'primary' ? 1 : 0,
              transform: state === 'primary' ? 'translateY(0px)' : 'translateY(18px)',
              transition: `opacity 0.72s cubic-bezier(0.16,1,0.3,1), transform 0.88s cubic-bezier(0.16,1,0.3,1)`,
              transitionDelay: state === 'primary' ? `${i * 90}ms` : '0ms',
            }}
          >
            {/* Card header row */}
            <div className="bento-header">
              <span className="service-code">{svc.code}</span>
              <span className="service-subtitle">{svc.subtitle}</span>
            </div>

            {/* Title */}
            <h3 className="bento-title">{svc.title}</h3>

            {/* Body */}
            <p className="bento-body">{svc.body}</p>

            {/* Featured stat — only on wide cards */}
            {svc.featured && svc.stat && (
              <div className="bento-stat">
                <span className="bento-stat-number">{svc.stat}</span>
                <span className="bento-stat-label">{svc.statLabel}</span>
              </div>
            )}

            {/* Corner arrow — architectural, not decorative */}
            <span className="bento-arrow">↗</span>
          </div>
        ))}
      </div>
    </div>
  );
}
