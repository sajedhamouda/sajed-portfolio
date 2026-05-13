/**
 * CinematicMonitor — Dev-only observability layer.
 *
 * Collects real-time performance intelligence about the cinematic runtime:
 *   - FPS (1s rolling + 5s rolling)
 *   - Frame spike detection
 *   - Scene entry/exit timing vs expected
 *   - Engine health flags
 *   - Memory growth indicators (subscriber counts)
 *
 * PRODUCTION SAFETY:
 *   All methods are guarded by `import.meta.env.DEV`. Vite replaces this
 *   constant with `false` at build time and the bundler dead-code-eliminates
 *   every branch, so zero bytes of this module reach the production bundle
 *   when the guards are respected.
 *
 * USAGE (in browser DevTools console while in dev mode):
 *   window.__cinematic.snapshot()     → full health object
 *   window.__cinematic.history()      → last 20 scene transitions
 *   window.__cinematic.fps()          → { avg1s, avg5s }
 *   window.__cinematic.reset()        → clear accumulators
 */

import type { SceneState } from '../scene-engine/SceneController';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FrameMetrics {
  /** Rolling 1-second average FPS */
  fps1s: number;
  /** Rolling 5-second average FPS */
  fps5s: number;
  /** Total frames recorded since init */
  totalFrames: number;
  /** Frames that exceeded the spike threshold (>33ms = below 30fps) */
  spikeCount: number;
  /** Worst single frame time seen (ms) */
  worstFrameMs: number;
}

export interface SceneTransitionRecord {
  sceneId: string;
  from: SceneState;
  to: SceneState;
  /** Performance.now() timestamp */
  timestamp: number;
  /** Ms since the previous transition on any scene */
  msSincePrev: number;
}

export interface EngineHealth {
  scrollEngineInitialized: boolean;
  scrollEngineRunning: boolean;
  pointerEngineMounted: boolean;
  pointerActive: boolean;
  bootComplete: boolean;
  sceneCount: number;
  pointerSubscribers: number;
  sceneSubscribers: number;
}

export interface CinematicSnapshot {
  timestamp: number;
  frames: FrameMetrics;
  health: EngineHealth;
  activeScene: string | null;
  scrollProgress: number;
  pointerNx: number;
  pointerNy: number;
}

// ── Monitor singleton ─────────────────────────────────────────────────────────

class CinematicMonitorClass {
  private static _instance: CinematicMonitorClass;

  // Frame tracking
  private _frameTimestamps: number[] = [];   // ring buffer of last N frame times
  private _frameDts: number[] = [];          // ring buffer of frame durations (ms)
  private readonly RING = 300;               // ~5s at 60fps
  private _totalFrames = 0;
  private _spikeCount = 0;
  private _worstFrameMs = 0;
  private _lastFrameTime: number | null = null;

  // Scene transition log
  private _transitions: SceneTransitionRecord[] = [];
  private readonly MAX_TRANSITIONS = 50;
  private _lastTransitionTime: number | null = null;

  // Health flags — updated via setters called by engine instrumentation
  private _health: EngineHealth = {
    scrollEngineInitialized: false,
    scrollEngineRunning: false,
    pointerEngineMounted: false,
    pointerActive: false,
    bootComplete: false,
    sceneCount: 0,
    pointerSubscribers: 0,
    sceneSubscribers: 0,
  };

  // Live read callbacks (provided by wiring layer)
  private _getScrollProgress: (() => number) | null = null;
  private _getPointerState: (() => { nx: number; ny: number; active: boolean }) | null = null;
  private _getActiveScene: (() => string | null) | null = null;

  private constructor() {}

  static getInstance(): CinematicMonitorClass {
    if (!CinematicMonitorClass._instance) {
      CinematicMonitorClass._instance = new CinematicMonitorClass();
    }
    return CinematicMonitorClass._instance;
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  /**
   * Initialize the monitor — attach to window.__cinematic in dev.
   * Call once from App.tsx in dev mode.
   */
  init(opts: {
    getScrollProgress: () => number;
    getPointerState: () => { nx: number; ny: number; active: boolean };
    getActiveScene: () => string | null;
  }): void {
    if (!import.meta.env.DEV) return;

    this._getScrollProgress = opts.getScrollProgress;
    this._getPointerState   = opts.getPointerState;
    this._getActiveScene    = opts.getActiveScene;

    // Expose on window for DevTools access
    (window as any).__cinematic = {
      snapshot: () => this.getSnapshot(),
      history:  () => [...this._transitions],
      fps:      () => ({ avg1s: this._computeFps(1000), avg5s: this._computeFps(5000) }),
      reset:    () => this._reset(),
      health:   () => ({ ...this._health }),
    };
  }

  // ── Frame recording (called from ScrollEngine RAF) ────────────────────────

  /** Record a single frame. Must be called every RAF tick from ScrollEngine. */
  recordFrame(now: number): void {
    if (!import.meta.env.DEV) return;

    const dt = this._lastFrameTime === null ? 16.67 : now - this._lastFrameTime;
    this._lastFrameTime = now;

    // Ring buffer — drop oldest when full
    if (this._frameTimestamps.length >= this.RING) {
      this._frameTimestamps.shift();
      this._frameDts.shift();
    }
    this._frameTimestamps.push(now);
    this._frameDts.push(dt);

    this._totalFrames++;

    // Spike: any frame longer than 33ms (below 30fps threshold)
    if (dt > 33) {
      this._spikeCount++;
      if (dt > this._worstFrameMs) this._worstFrameMs = dt;
    }
  }

  // ── Scene transition recording (called from SceneController) ─────────────

  recordSceneTransition(sceneId: string, from: SceneState, to: SceneState, now: number): void {
    if (!import.meta.env.DEV) return;

    const msSincePrev = this._lastTransitionTime === null ? 0 : now - this._lastTransitionTime;
    this._lastTransitionTime = now;

    const record: SceneTransitionRecord = { sceneId, from, to, timestamp: now, msSincePrev };

    if (this._transitions.length >= this.MAX_TRANSITIONS) {
      this._transitions.shift();
    }
    this._transitions.push(record);
  }

  // ── Health flag setters (called by engine instrumentation) ───────────────

  setScrollEngineInitialized(v: boolean): void {
    if (!import.meta.env.DEV) return;
    this._health.scrollEngineInitialized = v;
  }

  setScrollEngineRunning(v: boolean): void {
    if (!import.meta.env.DEV) return;
    this._health.scrollEngineRunning = v;
  }

  setPointerEngineMounted(v: boolean): void {
    if (!import.meta.env.DEV) return;
    this._health.pointerEngineMounted = v;
  }

  setPointerActive(v: boolean): void {
    if (!import.meta.env.DEV) return;
    this._health.pointerActive = v;
  }

  setBootComplete(v: boolean): void {
    if (!import.meta.env.DEV) return;
    this._health.bootComplete = v;
  }

  setSceneCount(n: number): void {
    if (!import.meta.env.DEV) return;
    this._health.sceneCount = n;
  }

  setPointerSubscribers(n: number): void {
    if (!import.meta.env.DEV) return;
    this._health.pointerSubscribers = n;
  }

  setSceneSubscribers(n: number): void {
    if (!import.meta.env.DEV) return;
    this._health.sceneSubscribers = n;
  }

  // ── Snapshot (Step 6 overlay reads this) ─────────────────────────────────

  getSnapshot(): CinematicSnapshot {
    const scroll  = this._getScrollProgress?.() ?? 0;
    const ptr     = this._getPointerState?.()   ?? { nx: 0, ny: 0, active: false };
    const scene   = this._getActiveScene?.()    ?? null;

    return {
      timestamp:    performance.now(),
      frames: {
        fps1s:        this._computeFps(1000),
        fps5s:        this._computeFps(5000),
        totalFrames:  this._totalFrames,
        spikeCount:   this._spikeCount,
        worstFrameMs: Math.round(this._worstFrameMs),
      },
      health:       { ...this._health },
      activeScene:  scene,
      scrollProgress: scroll,
      pointerNx:    ptr.nx,
      pointerNy:    ptr.ny,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Compute average FPS over the last `windowMs` milliseconds. */
  private _computeFps(windowMs: number): number {
    const now = performance.now();
    const cutoff = now - windowMs;
    let count = 0;
    for (let i = this._frameTimestamps.length - 1; i >= 0; i--) {
      if (this._frameTimestamps[i] < cutoff) break;
      count++;
    }
    return count === 0 ? 0 : Math.round((count / windowMs) * 1000);
  }

  private _reset(): void {
    this._frameTimestamps = [];
    this._frameDts = [];
    this._totalFrames = 0;
    this._spikeCount = 0;
    this._worstFrameMs = 0;
    this._lastFrameTime = null;
    this._transitions = [];
    this._lastTransitionTime = null;
  }
}

export const CinematicMonitor = CinematicMonitorClass.getInstance();
