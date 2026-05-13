import Lenis from 'lenis';
import { SceneController } from '../scene-engine/SceneController';

class ScrollEngineClass {
  private static instance: ScrollEngineClass;
  private lenis: Lenis | null = null;
  private isInitialized = false;
  private rafId: number | null = null;

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
    this.startRaf();
    this.isInitialized = true;
  }

  private startRaf(): void {
    const raf = (time: number) => {
      if (this.lenis) {
        this.lenis.raf(time);
      }
      this.updateSceneProgress();
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);
  }

  private updateSceneProgress(): void {
    if (!this.lenis) return;
    const scrollProgress = this.lenis.progress ?? 0;
    SceneController.update(scrollProgress);
  }

  start(): void {
    if (this.lenis) {
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
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.isInitialized = false;
  }
}

export const ScrollEngine = ScrollEngineClass.getInstance();
