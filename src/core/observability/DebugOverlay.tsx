/**
 * DebugOverlay — Dev-only cinematic performance HUD.
 *
 * Toggle: Ctrl+Shift+D
 *
 * Displays:
 *   - FPS (1s + 5s rolling)
 *   - Frame spikes / worst frame
 *   - Active scene + scroll progress
 *   - Pointer state (normalized x/y + active)
 *   - Engine health flags
 *   - Memory growth indicators (subscriber counts)
 *
 * PRODUCTION SAFETY:
 *   This file is ONLY imported inside an `if (import.meta.env.DEV)` branch
 *   in App.tsx. Vite's static analysis sees the false branch and excludes
 *   this module entirely from the production bundle via tree-shaking.
 *
 * PERFORMANCE:
 *   - Polls CinematicMonitor.getSnapshot() once per second via setInterval.
 *   - When hidden (visible=false), renders null — zero React work.
 *   - No RAF. No scroll listeners. No pointer listeners.
 *   - All DOM writes are inside a React subtree that has no impact on
 *     the cinematic layers (fixed, z-index 99998, pointer-events: none).
 */

import { useState, useEffect, useCallback } from 'react';
import { CinematicMonitor } from './CinematicMonitor';
import type { CinematicSnapshot } from './CinematicMonitor';

// ── Styles — inline only, no CSS module needed ────────────────────────────────

const PANEL: React.CSSProperties = {
  position: 'fixed',
  top: 12,
  right: 12,
  zIndex: 99998,
  background: 'rgba(0, 0, 0, 0.82)',
  border: '1px solid rgba(0, 240, 255, 0.25)',
  borderRadius: 4,
  padding: '10px 14px',
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 11,
  lineHeight: 1.6,
  color: 'rgba(0, 240, 255, 0.9)',
  pointerEvents: 'none',
  userSelect: 'none',
  minWidth: 220,
  backdropFilter: 'blur(8px)',
};

const LABEL: React.CSSProperties = {
  color: 'rgba(0, 240, 255, 0.45)',
  marginRight: 6,
};

const OK: React.CSSProperties    = { color: '#4ade80' };
const WARN: React.CSSProperties  = { color: '#facc15' };
const ERR: React.CSSProperties   = { color: '#f87171' };

function flag(v: boolean, label: string) {
  return <span style={v ? OK : ERR}>{v ? '✓' : '✗'} {label}</span>;
}

function fps(n: number) {
  const style = n >= 55 ? OK : n >= 40 ? WARN : ERR;
  return <span style={style}>{n}</span>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [snap, setSnap]       = useState<CinematicSnapshot | null>(null);

  // Toggle on Ctrl+Shift+D — keydown only, non-blocking
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      setVisible(v => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Poll CinematicMonitor at 1Hz — only when visible
  useEffect(() => {
    if (!visible) return;
    const tick = () => setSnap(CinematicMonitor.getSnapshot());
    tick(); // immediate snapshot on show
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible || !snap) return null;

  const { frames, health, activeScene, scrollProgress, pointerNx, pointerNy } = snap;

  return (
    <div style={PANEL} aria-hidden="true">
      {/* Header */}
      <div style={{ marginBottom: 6, borderBottom: '1px solid rgba(0,240,255,0.15)', paddingBottom: 4 }}>
        <span style={{ letterSpacing: '0.15em', fontSize: 10, opacity: 0.6 }}>
          CINEMATIC MONITOR
        </span>
        <span style={{ float: 'right', opacity: 0.4, fontSize: 10 }}>Ctrl+Shift+D</span>
      </div>

      {/* FPS */}
      <div>
        <span style={LABEL}>FPS 1s</span>{fps(frames.fps1s)}
        <span style={{ ...LABEL, marginLeft: 12 }}>5s</span>{fps(frames.fps5s)}
      </div>
      <div>
        <span style={LABEL}>spikes</span>
        <span style={frames.spikeCount > 10 ? WARN : OK}>{frames.spikeCount}</span>
        <span style={{ ...LABEL, marginLeft: 12 }}>worst</span>
        <span style={frames.worstFrameMs > 50 ? WARN : OK}>{frames.worstFrameMs}ms</span>
      </div>
      <div>
        <span style={LABEL}>frames</span>{frames.totalFrames}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,240,255,0.1)', margin: '5px 0' }} />

      {/* Scene + scroll */}
      <div>
        <span style={LABEL}>scene</span>
        <span style={{ color: '#e2e8f0' }}>{activeScene ?? '—'}</span>
      </div>
      <div>
        <span style={LABEL}>scroll</span>
        {(scrollProgress * 100).toFixed(1)}%
      </div>

      {/* Pointer */}
      <div>
        <span style={LABEL}>ptr</span>
        {pointerNx.toFixed(3)}, {pointerNy.toFixed(3)}
        <span style={{ ...LABEL, marginLeft: 8 }}>active</span>
        <span style={health.pointerActive ? OK : WARN}>
          {health.pointerActive ? 'yes' : 'no'}
        </span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,240,255,0.1)', margin: '5px 0' }} />

      {/* Engine health */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {flag(health.scrollEngineInitialized, 'scroll init')}
        {flag(health.scrollEngineRunning,     'scroll running')}
        {flag(health.pointerEngineMounted,    'pointer mount')}
        {flag(health.bootComplete,            'boot done')}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,240,255,0.1)', margin: '5px 0' }} />

      {/* Memory indicators */}
      <div>
        <span style={LABEL}>scenes</span>{health.sceneCount}
        <span style={{ ...LABEL, marginLeft: 8 }}>ptr subs</span>
        <span style={health.pointerSubscribers > 10 ? WARN : OK}>{health.pointerSubscribers}</span>
      </div>
      <div>
        <span style={LABEL}>scene subs</span>
        <span style={health.sceneSubscribers > 20 ? WARN : OK}>{health.sceneSubscribers}</span>
      </div>
    </div>
  );
}
