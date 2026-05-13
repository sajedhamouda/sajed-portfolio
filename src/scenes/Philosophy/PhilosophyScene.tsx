import { SceneWrapper } from '../../core/scene-engine/SceneWrapper';
import { useSceneProgress } from '../../core/scene-engine/useSceneProgress';
import type { SceneState } from '../../core/scene-engine/SceneController';
import { SCENE_REGISTRY } from '../../core/scene-engine/SceneRegistry';

export function PhilosophyScene() {
  return (
    <SceneWrapper sceneId="philosophy" className="scene-layer philosophy-layer">
      {(state) => <PhilosophyContent state={state} />}
    </SceneWrapper>
  );
}

function PhilosophyContent({ state }: { state: SceneState }) {
  const { progress } = useSceneProgress('philosophy');
  const reg = SCENE_REGISTRY.philosophy;
  const local = Math.max(0, Math.min(1, (progress - reg.start) / (reg.end - reg.start)));

  const isInactive = state === 'inactive';
  const isSecondary = state === 'secondary';

  // Blur-to-sharp: enters blurred, sharpens continuously as local advances
  const blurPx = isInactive ? 12 : isSecondary ? 8 - local * 6 : 0;
  const opacity = isInactive ? 0 : isSecondary ? 0.35 : 1;
  // Enters from below, drifts upward — continuous across full secondary range
  const translateY = isInactive ? 60 : isSecondary ? 30 - local * 50 : 0;

  return (
    <div
      className="philosophy-wrap"
      style={{
        opacity,
        filter: `blur(${blurPx}px)`,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 1.64s cubic-bezier(0.16,1,0.3,1), filter 1.92s cubic-bezier(0.25,1,0.3,1), transform 2.08s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Section label */}
      <div className="section-eyeline">
        <span className="eyeline-dash" />
        <span className="eyeline-text">PHILOSOPHY</span>
      </div>

      {/* Editorial headline */}
      <h2 className="philo-headline">
        Design is not<br />
        <em className="philo-em">decoration.</em>
      </h2>

      {/* Body text — slow reading rhythm */}
      <div className="philo-body">
        <p className="philo-para">
          Every digital presence I build begins with a single question:
          what does this brand <em>feel like</em> when it's working perfectly?
          The answer guides every decision — from typographic weight to
          the silence between elements.
        </p>
        <p className="philo-para">
          Luxury is not loudness. It is precision. It is the restraint
          to remove rather than add. It is the confidence to let
          a single element carry the room.
        </p>
      </div>

      {/* Three principles — staggered vertical */}
      <div className="philo-principles">
        {[
          { n: '01', title: 'Restraint', body: 'Every element must earn its place or be removed.' },
          { n: '02', title: 'Precision', body: 'Pixel-level decisions produce brand-level results.' },
          { n: '03', title: 'Narrative', body: 'A website is a story. Pacing matters as much as design.' },
        ].map((p) => (
          <div key={p.n} className="philo-principle">
            <span className="principle-num">{p.n}</span>
            <h3 className="principle-title">{p.title}</h3>
            <p className="principle-body">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
