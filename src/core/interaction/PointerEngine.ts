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

  private _raw    = { x: 0, y: 0 };
  private _target = { x: 0, y: 0 };
  private _current = { x: 0, y: 0 };
  private _active  = false;
  private _rafId: number | null = null;
  private _subs: Set<Subscriber> = new Set();
  private _mounted = false;

  /** Lerp factor — lower = slower/more cinematic (0.04 ≈ 90% decay in ~56 frames) */
  private LERP = 0.055;

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

    const onMove = (e: MouseEvent) => {
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
    };

    const onLeave = () => { this._active = false; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });

    this._startRaf();
  }

  unmount(): void {
    // In practice this is never called (app lifetime = page lifetime)
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._mounted = false;
  }

  subscribe(fn: Subscriber): () => void {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
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
    const tick = () => {
      // Lerp toward raw — creates smooth follow without JS spring physics
      if (this._active) {
        this._target.x = this._raw.x;
        this._target.y = this._raw.y;
      }
      this._current.x += (this._target.x - this._current.x) * this.LERP;
      this._current.y += (this._target.y - this._current.y) * this.LERP;

      // Only notify if we have subscribers and meaningful movement
      if (this._subs.size > 0) {
        const snap = this.getState();
        this._subs.forEach(fn => fn(snap));
      }

      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }
}

export const PointerEngine = PointerEngineClass.getInstance();
