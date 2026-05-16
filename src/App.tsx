import { lazy, Suspense, useEffect, useState } from 'react';
import { HeroSignature } from './visual/signature/HeroSignature';
import { HeroScene } from './scenes/Hero/HeroScene';
import { CinematicOrchestrator } from './boot/CinematicOrchestrator';
import { ErrorMonitor } from './core/monitoring/ErrorMonitor';
import './scenes/Hero/HeroScene.css';
import './styles/scenes.css';

// Atmosphere layers are lazy-loaded so Three.js (and other heavy deps) don't
// land in the main entry bundle. They mount after cinematic-entry fires.
const ThreeCanvas = lazy(() => import('./visual/three/ThreeCanvas').then(m => ({ default: m.ThreeCanvas })));
const DotGrid     = lazy(() => import('./visual/atmosphere/DotGrid').then(m => ({ default: m.DotGrid })));
const DepthLayer  = lazy(() => import('./visual/atmosphere/DepthLayer').then(m => ({ default: m.DepthLayer })));
const CursorField = lazy(() => import('./visual/atmosphere/CursorField').then(m => ({ default: m.CursorField })));

// Non-hero scenes are lazy-loaded — they land in separate chunks and are
// fetched only after the cinematic loader clears, keeping first-paint lean.
const PhilosophyScene = lazy(() => import('./scenes/Philosophy/PhilosophyScene').then(m => ({ default: m.PhilosophyScene })));
const ServicesScene   = lazy(() => import('./scenes/Services/ServicesScene').then(m => ({ default: m.ServicesScene })));
const WorkScene       = lazy(() => import('./scenes/Work/WorkScene').then(m => ({ default: m.WorkScene })));
const LogosScene      = lazy(() => import('./scenes/Logos/LogosScene').then(m => ({ default: m.LogosScene })));
const CTAScene        = lazy(() => import('./scenes/CTA/CTAScene').then(m => ({ default: m.CTAScene })));

// Dev-only observability — tree-shaken entirely in production builds.
// Vite replaces import.meta.env.DEV with false and the bundler removes
// the dead branch, so neither CinematicMonitor nor DebugOverlay reach prod.
import { CinematicMonitor } from './core/observability/CinematicMonitor';
import { DebugOverlay } from './core/observability/DebugOverlay';
import { SceneController } from './core/scene-engine/SceneController';
import { PointerEngine } from './core/interaction/PointerEngine';

const ASCII_LOGO = `\
███████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
██╔════╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
███████╗█████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
╚════██║██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
███████║███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                                                   
███████╗██╗      █████╗ ██╗   ██╗████████╗    ███████╗ ██████╗ █████╗ ███╗   ██╗
██╔════╝██║     ██╔══██╗██║   ██║╚══██╔══╝    ██╔════╝██╔════╝██╔══██╗████╗  ██║
███████╗██║     ███████║██║   ██║   ██║       ███████╗██║     ███████║██╔██╗ ██║
╚════██║██║     ██╔══██╗██║   ██║   ██║       ╚════██║██║     ██╔══██║██║╚██╗██║
███████║███████╗██║  ██║╚██████╔╝   ██║       ███████║╚██████╗██║  ██║██║ ╚████║
╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝    ╚═╝       ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝`;

export function App() {
  // Orchestrator-driven UI state.
  // App.tsx owns ONLY the visual shell — it has no knowledge of timing or engines.
  const [domReady, setDomReady]               = useState(false);
  const [loaderVisible, setLoaderVisible]     = useState(true);
  const [loaderOpacity, setLoaderOpacity]     = useState(1);
  const [appOpacity, setAppOpacity]           = useState(0);
  const [status, setStatus]                   = useState('DA VINCI STUDIO');
  // Atmosphere layers (DotGrid, ThreeCanvas, DepthLayer, CursorField) mount only
  // after cinematic-entry fires — when the loader starts fading and they become
  // visible. Prevents wasteful RAF + WebGL work hidden behind the loader.
  const [atmosphereReady, setAtmosphereReady] = useState(false);

  useEffect(() => {
    // Initialize observability in dev — no-op in production (tree-shaken).
    if (import.meta.env.DEV) {
      CinematicMonitor.init({
        getScrollProgress: () => SceneController.getScrollProgress(),
        getPointerState:   () => {
          const s = PointerEngine.getState();
          return { nx: s.nx, ny: s.ny, active: s.active };
        },
        getActiveScene: () => {
          const scenes = ['hero', 'philosophy', 'services', 'work', 'logos', 'cta'];
          return scenes.find(id => SceneController.getState(id) === 'primary') ?? null;
        },
      });
    }

    // Mount error monitor — captures unhandled errors + promise rejections in production.
    ErrorMonitor.mount();

    // Hand full startup authority to the orchestrator.
    // App.tsx provides only React state setters — zero timing or engine logic here.
    CinematicOrchestrator.run({
      onDomReady:      () => setDomReady(true),
      onStatusChange:  (s) => setStatus(s),
      onLoaderFadeOut: () => setLoaderOpacity(0),
      onAppFadeIn:     () => setAppOpacity(1),
      onLoaderUnmount: () => setLoaderVisible(false),
    });

    // Mount atmosphere layers when cinematic-entry fires (loader begins fading).
    // Using { once: true } so the listener auto-cleans itself.
    const onEntry = () => setAtmosphereReady(true);
    window.addEventListener('cinematic-entry', onEntry, { once: true });

    return () => {
      CinematicOrchestrator.cancel();
      ErrorMonitor.unmount();
      window.removeEventListener('cinematic-entry', onEntry);
    };
  }, []);

  return (
    <>
      {/* ── Cinematic loader overlay — fades out on orchestrator entry signal ── */}
      {loaderVisible && (
        <div
          aria-hidden={!loaderVisible}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: loaderOpacity,
            transition: 'opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: loaderOpacity < 0.1 ? 'none' : undefined,
          }}
        >
          <pre
            style={{
              display: 'block',
              color: '#00ffff',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 'clamp(5px, 1vw, 10px)',
              lineHeight: 1.15,
              textShadow: '0 0 8px rgba(0,240,255,0.7)',
              whiteSpace: 'pre',
              margin: 0,
              marginBottom: '32px',
              textAlign: 'left',
              letterSpacing: 0,
              wordSpacing: 0,
              writingMode: 'horizontal-tb',
              alignSelf: 'center',
              opacity: 0.85,
            }}
          >
            {ASCII_LOGO}
          </pre>

          <div
            style={{
              color: 'rgba(0, 240, 255, 0.6)',
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: '11px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            {status}
          </div>
        </div>
      )}

      {/* ── Main app — pre-mounted by orchestrator, fades in on entry signal ── */}
      {domReady && (
        <div
          style={{
            position: 'relative',
            opacity: appOpacity,
            transition: 'opacity 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Atmosphere layers mount only after cinematic-entry fires (loader fade start).
              Suspense needed because these are now lazy imports.
              fallback=null: invisible during load — they become visible via the app
              opacity transition, not by appearing suddenly. */}
          {atmosphereReady && (
            <Suspense fallback={null}>
              {/* Layer 1 — background environmental (slowest motion) */}
              <DotGrid />
              <ThreeCanvas />
              {/* Layer 2 — atmospheric depth & blinds (medium, scroll-driven) */}
              <DepthLayer />
              {/* Layer 2b — cursor field light source (pointer-driven) */}
              <CursorField />
            </Suspense>
          )}
          {/* Layer 2c — hero signature identity frame */}
          <HeroSignature />
          {/* Layer 3 — scene content (most restrained) */}
          <HeroScene />
          {/* Non-hero scenes are lazy chunks — Suspense holds nothing visible
              (layout is already reserved by the 500vh scroll spacer below).
              They stream in during the cinematic loader, invisible behind it. */}
          <Suspense fallback={null}>
            <PhilosophyScene />
            <ServicesScene />
            <WorkScene />
            <LogosScene />
            <CTAScene />
          </Suspense>
          {/* Scroll spacer — room for Lenis to travel through all scenes */}
          <div aria-hidden="true" style={{ height: '500vh', pointerEvents: 'none' }} />
        </div>
      )}

      {/* Dev-only performance HUD — tree-shaken in production. Toggle: Ctrl+Shift+D */}
      {import.meta.env.DEV && <DebugOverlay />}
    </>
  );
}
