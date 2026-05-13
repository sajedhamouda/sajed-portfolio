import Lenis from 'lenis';
import { SceneController } from '../scene-engine/SceneController';

class ScrollEngineClass {
  private static instance: ScrollEngineClass;
  private lenis: Lenis | null = null;
  private isInitialized = false;
  private rafId: number | null = null;
  /** True when Lenis has been started (unlocked by orchestrator entry). */
  private _running = false;
  /** Bound reference kept so removeEventListener is exact. */
  private _onVisibilityChange: (() => void) | null = null;

  private constructor() {}

  static getInstance(): ScrollEngineClass {
    if (!ScrollEngineClass.instance) {
      ScrollEngineClass.instance = new ScrollEngineClass();
    }
    return ScrollEngineClass.instance;
  }

  initialize(): void {
    if (this.isInitialized) return;

    // Lenis v1 API — only supported options
    this.lenis = new Lenis({
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      autoResize: true,
    });

    this.lenis.stop();
    this._startRaf();

    // visibilitychange — pause Lenis when tab is hidden, resume when shown.
    // Without this, the browser's RAF suspension causes the `time` parameter
    // to carry a large gap on resume, making Lenis advance scroll in one jump.
    this._onVisibilityChange = () => {
      if (!this.lenis) return;
      if (document.hidden) {
        // Tab hidden: pause Lenis so no state accumulates.
        this.lenis.stop();
      } else {
        // Tab shown: only resume if the engine had been started by the orchestrator.
        if (this._running) {
          this.lenis.start();
        }
      }
    };
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    this.isInitialized = true;
  }

  private _startRaf(): void {
    const raf = (time: number) => {
      if (this.lenis) {
        this.lenis.raf(time);
      }
      this._updateSceneProgress();
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);
  }

  private _updateSceneProgress(): void {
    if (!this.lenis) return;
    const scrollProgress = this.lenis.progress ?? 0;
    SceneController.update(scrollProgress);
  }

  start(): void {
    this._running = true;
    if (this.lenis && !document.hidden) {
      this.lenis.start();
    }
  }

  stop(): void {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this._onVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
      this._onVisibilityChange = null;
    }
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.isInitialized = false;
    this._running = false;
  }
}

export const ScrollEngine = ScrollEngineClass.getInstance();
