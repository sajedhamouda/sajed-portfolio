/**
 * PointerEngine — Centralized pointer proximity system.
 *
 * Architecture:
 * - ONE global mousemove listener on window
 * - ONE RAF loop that reads pointer state and notifies subscribers
 * - Subscribers receive a PointerState snapshot each frame
 * - Zero per-element listeners; zero React re-render spam
 *
 * All output values are normalized 0–1 or direct px coords.
 * Consumers apply their own easing to avoid coupling.
 *
 * Scene-awareness: exposes `sceneIntensity` derived from
 * SceneController state so every scene can gate its interaction.
 */

import { SceneController } from '../scene-engine/SceneController';
import { CinematicMonitor } from '../observability/CinematicMonitor';

export interface PointerState {
  /** Raw viewport coordinates */
  x: number;
  y: number;
  /** Normalized 0–1 position (0,0 = top-left) */
  nx: number;
  ny: number;
  /** Centered normalized -1 to +1 */
  cx: number;
  cy: number;
  /** Is pointer inside the viewport? */
  active: boolean;
}

type Subscriber = (state: PointerState) => void;

class PointerEngineClass {
  private static _instance: PointerEngineClass;

  private _raw     = { x: 0, y: 0 };
  private _target  = { x: 0, y: 0 };
  private _current = { x: 0, y: 0 };
  private _active  = false;
  private _rafId: number | null = null;
  private _lastTime: number | null = null;
  private _subs: Set<Subscriber> = new Set();
  private _mounted = false;
  /** True when the user has requested reduced motion — JS-driven pointer effects are skipped. */
  private _reducedMotion = false;

  /**
   * Target lerp factor at 60fps — delta-time normalized in the RAF tick so
   * behaviour is consistent at 30fps, 60fps, and 120fps.
   * 0.055 at 60fps ≈ 90% decay in ~40 frames (~667ms).
   */
  private readonly LERP_60 = 0.055;

  // Stored listener references so unmount() can cleanly remove them.
  private _onMove: ((e: MouseEvent) => void) | null = null;
  private _onLeave: (() => void) | null = null;

  private constructor() {}

  static getInstance(): PointerEngineClass {
    if (!PointerEngineClass._instance) {
      PointerEngineClass._instance = new PointerEngineClass();
    }
    return PointerEngineClass._instance;
  }

  /** Call once at app mount */
  mount(): void {
    if (this._mounted) return;
    this._mounted = true;

    // Check and track prefers-reduced-motion media query
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reducedMotion = mq.matches;
    mq.addEventListener('change', (e) => { this._reducedMotion = e.matches; });

    this._onMove = (e: MouseEvent) => {
      this._raw.x = e.clientX;
      this._raw.y = e.clientY;
      if (!this._active) {
        // Snap current to raw on first move so no "slide-in" from 0,0
        this._current.x = e.clientX;
        this._current.y = e.clientY;
        this._target.x  = e.clientX;
        this._target.y  = e.clientY;
      }
      this._active = true;
      if (import.meta.env.DEV) CinematicMonitor.setPointerActive(true);
    };

    this._onLeave = () => {
      this._active = false;
      if (import.meta.env.DEV) CinematicMonitor.setPointerActive(false);
    };

    window.addEventListener('mousemove', this._onMove, { passive: true });
    window.addEventListener('mouseleave', this._onLeave, { passive: true });

    this._startRaf();
    if (import.meta.env.DEV) CinematicMonitor.setPointerEngineMounted(true);
  }

  unmount(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._onMove)  window.removeEventListener('mousemove',  this._onMove);
    if (this._onLeave) window.removeEventListener('mouseleave', this._onLeave);
    this._onMove  = null;
    this._onLeave = null;
    this._mounted = false;
    this._lastTime = null;
    if (import.meta.env.DEV) {
      CinematicMonitor.setPointerEngineMounted(false);
      CinematicMonitor.setPointerActive(false);
      CinematicMonitor.setPointerSubscribers(0);
    }
  }

  subscribe(fn: Subscriber): () => void {
    this._subs.add(fn);
    if (import.meta.env.DEV) CinematicMonitor.setPointerSubscribers(this._subs.size);
    return () => {
      this._subs.delete(fn);
      if (import.meta.env.DEV) CinematicMonitor.setPointerSubscribers(this._subs.size);
    };
  }

  /** Current lerped state snapshot — read by consumers synchronously */
  getState(): PointerState {
    const vw = window.innerWidth  || 1;
    const vh = window.innerHeight || 1;
    const x  = this._current.x;
    const y  = this._current.y;
    return {
      x, y,
      nx: x / vw,
      ny: y / vh,
      cx: (x / vw) * 2 - 1,
      cy: (y / vh) * 2 - 1,
      active: this._active,
    };
  }

  /**
   * Returns the interaction intensity multiplier [0–1] for a given scene.
   * primary → 1.0, secondary → 0.3, inactive → 0.0
   */
  sceneIntensity(sceneId: string): number {
    const state = SceneController.getState(sceneId);
    if (state === 'primary')   return 1.0;
    if (state === 'secondary') return 0.3;
    return 0.0;
  }

  private _startRaf(): void {
    const tick = (now: number) => {
      // Delta-time normalized LERP — consistent feel at 30/60/120fps.
      // dt is clamped to [0, 100ms] so a tab-resume spike doesn't jump.
      const dt = this._lastTime === null ? 16.67 : Math.min(now - this._lastTime, 100);
      this._lastTime = now;
      // Equivalent per-frame lerp for this dt: 1 - (1-LERP_60)^(dt/16.667)
      const lerp = 1 - Math.pow(1 - this.LERP_60, dt / 16.667);

      // Lerp toward raw — creates smooth follow without JS spring physics
      if (this._active) {
        this._target.x = this._raw.x;
        this._target.y = this._raw.y;
      }
      this._current.x += (this._target.x - this._current.x) * lerp;
      this._current.y += (this._target.y - this._current.y) * lerp;

      // Skip JS-driven pointer effects when user prefers reduced motion.
      // Position is still tracked so getState() remains accurate.
      if (this._subs.size > 0 && !this._reducedMotion) {
        const snap = this.getState();
        this._subs.forEach(fn => fn(snap));
      }

      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }
}

export const PointerEngine = PointerEngineClass.getInstance();
