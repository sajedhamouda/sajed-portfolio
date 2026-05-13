import { useState } from 'react';
import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

const PROJECTS = [
  {
    id: 'PRJ-01',
    category: 'Luxury Kitchen Brand',
    title: 'Al Rafidain Kitchens',
    description: 'Full brand identity + Wix website for a premium UAE kitchen manufacturer. 3× inquiry rate within 60 days.',
    tags: ['Wix', 'Brand Identity', 'Arabic/English'],
    accent: '#00f0ff',
  },
  {
    id: 'PRJ-02',
    category: 'Healthcare Clinic',
    title: 'LifePoint Medical',
    description: 'Patient-first UI for a multi-specialty clinic. Appointment flows redesigned for mobile — 40% drop in bounce.',
    tags: ['UI/UX', 'Webflow', 'Bilingual'],
    accent: '#a78bfa',
  },
  {
    id: 'PRJ-03',
    category: 'SaaS Dashboard',
    title: 'Qafilah Logistics',
    description: 'Real-time fleet management dashboard. Dark-mode-first, Arabic RTL, 8 custom chart types.',
    tags: ['React', 'Figma', 'RTL'],
    accent: '#00f0ff',
  },
];

export function WorkScene() {
  return (
    <SceneWrapper sceneId="work" className="scene-layer work-layer">
      {(state) => <WorkContent state={state} />}
    </SceneWrapper>
  );
}

function WorkContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('work');
  const reg = SCENE_REGISTRY.work;
  const local = Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isInactive  = state === 'inactive';
  const isSecondary = state === 'secondary';

  const opacity    = isInactive ? 0 : isSecondary ? 0.3 : 1;
  const blurPx     = isInactive ? 10 : isSecondary ? 4 : 0;
  const translateY = isInactive ? 60 : isSecondary ? 30 - local * 50 : 0;

  // Step 4: Track which row is hovered so siblings can dim.
  // Uses React state (one integer) — only fires on enter/leave, not per frame.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Interaction intensity from SceneController (Step 7)
  const intensity = state === 'primary' ? 1 : state === 'secondary' ? 0.3 : 0;

  return (
    <div
      className="work-wrap"
      style={{
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 1.55s cubic-bezier(0.16,1,0.3,1), filter 1.84s cubic-bezier(0.25,1,0.3,1), transform 2.0s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div className="section-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">SELECTED WORK</span>
      </div>

      <h2 className="work-headline">Proof of concept</h2>

      <div className="work-list">
        {PROJECTS.map((proj, i) => {
          // Step 4: Compute per-row dimming based on hovered sibling
          const isHovered  = hoveredIdx === i;
          const isSibling  = hoveredIdx !== null && !isHovered;
          // Siblings dim slightly; hovered row sharpens — all via opacity + filter
          // Scale impact by scene intensity so secondary/inactive barely reacts
          const rowOpacity = isSibling
            ? 1 - 0.35 * intensity
            : 1;
          const rowBrightness = isHovered
            ? 1 + 0.06 * intensity
            : 1;

          return (
            <div
              key={proj.id}
              className="work-item"
              style={{
                transitionDelay: state === 'primary' ? `${i * 150}ms` : '0ms',
                '--accent': proj.accent,
                opacity: rowOpacity,
                filter: `brightness(${rowBrightness})`,
                transition: `
                  opacity 0.7s cubic-bezier(0.16,1,0.3,1),
                  filter 0.7s cubic-bezier(0.16,1,0.3,1),
                  background 0.4s cubic-bezier(0.16,1,0.3,1),
                  border-color 0.4s cubic-bezier(0.16,1,0.3,1)
                `,
              } as React.CSSProperties}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="work-meta">
                <span className="work-id">{proj.id}</span>
                <span className="work-category">{proj.category}</span>
              </div>
              <div className="work-content">
                <h3 className="work-title">{proj.title}</h3>
                <p className="work-desc">{proj.description}</p>
                <div className="work-tags">
                  {proj.tags.map((t) => (
                    <span key={t} className="work-tag">{t}</span>
                  ))}
                </div>
              </div>
              <span className="work-arrow">↗</span>
            </div>
          );
        })}
      </div>

      <div className="work-cta-row">
        <span className="work-cta-label">Selected projects</span>
        <a href="mailto:sajed@davincistudio.ae" className="work-cta-link">Request full portfolio ↗</a>
      </div>
    </div>
  );
}
