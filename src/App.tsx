import { useEffect, useState } from 'react';
import { ThreeCanvas } from './visual/three/ThreeCanvas';
import { DotGrid } from './visual/atmosphere/DotGrid';
import { DepthLayer } from './visual/atmosphere/DepthLayer';
import { CursorField } from './visual/atmosphere/CursorField';
import { HeroSignature } from './visual/signature/HeroSignature';
import { HeroScene } from './scenes/Hero/HeroScene';
import { PhilosophyScene } from './scenes/Philosophy/PhilosophyScene';
import { ServicesScene } from './scenes/Services/ServicesScene';
import { WorkScene } from './scenes/Work/WorkScene';
import { LogosScene } from './scenes/Logos/LogosScene';
import { CTAScene } from './scenes/CTA/CTAScene';
import { CinematicOrchestrator } from './boot/CinematicOrchestrator';
import './scenes/Hero/HeroScene.css';
import './styles/scenes.css';

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
  const [domReady, setDomReady]           = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderOpacity, setLoaderOpacity] = useState(1);
  const [appOpacity, setAppOpacity]       = useState(0);
  const [status, setStatus]               = useState('DA VINCI STUDIO');

  useEffect(() => {
    // Hand full startup authority to the orchestrator.
    // App.tsx provides only React state setters — zero timing or engine logic here.
    CinematicOrchestrator.run({
      onDomReady:      () => setDomReady(true),
      onStatusChange:  (s) => setStatus(s),
      onLoaderFadeOut: () => setLoaderOpacity(0),
      onAppFadeIn:     () => setAppOpacity(1),
      onLoaderUnmount: () => setLoaderVisible(false),
    });

    return () => CinematicOrchestrator.cancel();
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
          {/* Layer 1 — background environmental (slowest motion) */}
          <DotGrid />
          <ThreeCanvas />
          {/* Layer 2 — atmospheric depth & blinds (medium, scroll-driven) */}
          <DepthLayer />
          {/* Layer 2b — cursor field light source (pointer-driven) */}
          <CursorField />
          {/* Layer 2c — hero signature identity frame */}
          <HeroSignature />
          {/* Layer 3 — scene content (most restrained) */}
          <HeroScene />
          <PhilosophyScene />
          <ServicesScene />
          <WorkScene />
          <LogosScene />
          <CTAScene />
          {/* Scroll spacer — room for Lenis to travel through all scenes */}
          <div aria-hidden="true" style={{ height: '500vh', pointerEvents: 'none' }} />
        </div>
      )}
    </>
  );
}
