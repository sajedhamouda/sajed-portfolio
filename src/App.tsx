import { useEffect, useRef, useState } from 'react';
import { ThreeCanvas } from './visual/three/ThreeCanvas';
import { DotGrid } from './visual/atmosphere/DotGrid';
import { DepthLayer } from './visual/atmosphere/DepthLayer';
import { CursorField } from './visual/atmosphere/CursorField';
import { HeroSignature } from './visual/signature/HeroSignature';
import { PointerEngine } from './core/interaction/PointerEngine';
import { HeroScene } from './scenes/Hero/HeroScene';
import { PhilosophyScene } from './scenes/Philosophy/PhilosophyScene';
import { ServicesScene } from './scenes/Services/ServicesScene';
import { WorkScene } from './scenes/Work/WorkScene';
import { LogosScene } from './scenes/Logos/LogosScene';
import { CTAScene } from './scenes/CTA/CTAScene';
import { initializeCinematicExperience } from './boot/CinematicApp';
import { BootSystemInstance } from './boot/BootSystem';
import { ScrollEngine } from './core/scroll/ScrollEngine';
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
  // booted: controls whether the main app is mounted (atmosphere pre-exists)
  // loaderVisible: controls whether the loader overlay is rendered
  // loaderOpacity: drives the CSS fade-out of the loader
  const [booted, setBooted] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderOpacity, setLoaderOpacity] = useState(1);
  const [appOpacity, setAppOpacity] = useState(0);
  const [status, setStatus] = useState('DA VINCI STUDIO');
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Wire status updates from BootSystem into React state
    BootSystemInstance.setStatusCallback(setStatus);

    // Register scenes + init ScrollEngine (stopped)
    initializeCinematicExperience();

    // Mount pointer engine — one global listener + one RAF loop
    PointerEngine.mount();

    // Mount the app DOM immediately so atmosphere (DotGrid, Three) pre-exists behind loader
    setBooted(true);

    function triggerEntry() {
      // Begin ScrollEngine so scenes can receive progress while fading in
      ScrollEngine.start();
      // Fade out loader over 1.1s, fade in app simultaneously
      setLoaderOpacity(0);
      setAppOpacity(1);
      // Signal to scene components that the experience is now visible.
      // Scenes that need entry-relative timing listen for this event.
      window.dispatchEvent(new CustomEvent('cinematic-entry'));
      // Unmount loader DOM after fade completes (200ms buffer after 1.1s transition)
      setTimeout(() => setLoaderVisible(false), 1300);
    }

    // Fallback — loader ALWAYS exits after 9s
    fallbackRef.current = setTimeout(triggerEntry, 9000);

    // Run the real boot sequence
    BootSystemInstance.boot()
      .then(() => {
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
        triggerEntry();
      })
      .catch(() => {
        if (fallbackRef.current) clearTimeout(fallbackRef.current);
        triggerEntry();
      });

    return () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ── Cinematic loader overlay — fades out on entry ── */}
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
          {/* ASCII art */}
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

      {/* ── Main app — pre-mounted behind loader, fades in on entry ── */}
      {booted && (
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
