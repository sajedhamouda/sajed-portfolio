import { BootSystemInstance } from './BootSystem';
import { SceneController } from '../core/scene-engine/SceneController';
import { ScrollEngine } from '../core/scroll/ScrollEngine';
import { PointerEngine } from '../core/interaction/PointerEngine';
import { createScene } from '../core/scene-engine/SceneRegistry';

/**
 * CinematicOrchestrator — Single source of truth for startup sequencing.
 *
 * Owns the full initialization pipeline in strict order:
 *
 *   1. Scene registration      (SceneController)
 *   2. Scroll engine init      (Lenis created, stopped — RAF running)
 *   3. Pointer engine mount    (mousemove + RAF, passive)
 *   4. Boot sequence run       (BootSystem cinematic status messages)
 *   5. Entry transition        (loader out, app in, scroll unlocked)
 *
 * No subsystem starts itself. The orchestrator is the only caller.
 *
 * App.tsx provides React state setters via OrchestratorCallbacks —
 * the orchestrator never imports React.
 */

export interface OrchestratorCallbacks {
  /** Show the app DOM (atmosphere, scenes) behind loader */
  onDomReady: () => void;
  /** Update the loader status line text */
  onStatusChange: (status: string) => void;
  /** Begin loader fade-out */
  onLoaderFadeOut: () => void;
  /** Begin app fade-in */
  onAppFadeIn: () => void;
  /** Remove loader from DOM after fade completes */
  onLoaderUnmount: () => void;
}

class CinematicOrchestratorClass {
  private static _instance: CinematicOrchestratorClass;
  private _started = false;
  private _fallback: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): CinematicOrchestratorClass {
    if (!CinematicOrchestratorClass._instance) {
      CinematicOrchestratorClass._instance = new CinematicOrchestratorClass();
    }
    return CinematicOrchestratorClass._instance;
  }

  /**
   * Start the cinematic pipeline. Called once by App.tsx on mount.
   * Idempotent — safe under React StrictMode double-invoke.
   */
  run(callbacks: OrchestratorCallbacks): void {
    if (this._started) return;
    this._started = true;

    console.log('[orchestrator] boot started');

    // ── Step 1: Register all scenes synchronously ──────────────────────────
    // Must happen before ScrollEngine RAF begins updating scene states.
    const sceneIds = ['hero', 'philosophy', 'services', 'work', 'logos', 'cta'] as const;
    sceneIds.forEach(id => SceneController.register(createScene(id)));

    console.log('[orchestrator] engine ready');

    // ── Step 2: Initialize ScrollEngine (Lenis created, stopped) ──────────
    // RAF loop starts here so SceneController gets progress=0 on every frame.
    // Lenis.start() is withheld until entry transition fires.
    ScrollEngine.initialize();

    // ── Step 3: Mount PointerEngine (mousemove listener + lerp RAF) ───────
    // Passive — no impact on scroll, no blocking.
    PointerEngine.mount();

    // ── Step 4: Mount app DOM behind loader ───────────────────────────────
    // DotGrid, ThreeCanvas, DepthLayer all begin rendering now, hidden behind
    // the loader at z-index:9999. When the loader fades, they are already live.
    callbacks.onDomReady();

    // ── Step 5: Wire status callback and run boot sequence ────────────────
    BootSystemInstance.setStatusCallback(callbacks.onStatusChange);

    // Safety fallback: entry always fires, even if BootSystem throws or hangs.
    // Lives here — not in App.tsx — so App.tsx has zero timing knowledge.
    this._fallback = setTimeout(() => {
      console.warn('[orchestrator] fallback entry triggered (boot did not resolve in time)');
      this._triggerEntry(callbacks);
    }, 9000);

    BootSystemInstance.boot()
      .then(() => {
        if (this._fallback) {
          clearTimeout(this._fallback);
          this._fallback = null;
        }
        console.log('[orchestrator] scenes ready');
        this._triggerEntry(callbacks);
      })
      .catch(() => {
        if (this._fallback) {
          clearTimeout(this._fallback);
          this._fallback = null;
        }
        this._triggerEntry(callbacks);
      });
  }

  /**
   * Entry transition — the ONLY place this sequence fires.
   * Order matters: scroll unlocks first, then visuals reveal.
   */
  private _triggerEntry(callbacks: OrchestratorCallbacks): void {
    console.log('[orchestrator] entry triggered');

    // Unlock scroll immediately — scenes need progress updates during fade-in.
    ScrollEngine.start();

    // Trigger React state transitions: loader out, app in (simultaneous).
    callbacks.onLoaderFadeOut();
    callbacks.onAppFadeIn();

    // Dispatch the cinematic-entry event — HeroScene listens for this.
    window.dispatchEvent(new CustomEvent('cinematic-entry'));

    // Unmount loader DOM 200ms after its 1.1s transition completes.
    setTimeout(() => callbacks.onLoaderUnmount(), 1300);
  }

  /** Cancel the safety fallback (called on App unmount for cleanliness). */
  cancel(): void {
    if (this._fallback) {
      clearTimeout(this._fallback);
      this._fallback = null;
    }
  }
}

export const CinematicOrchestrator = CinematicOrchestratorClass.getInstance();
