export type SceneState = 'inactive' | 'secondary' | 'primary';
import { CinematicMonitor } from '../observability/CinematicMonitor';

export interface Scene {
  id: string;
  scrollStart: number;
  scrollEnd: number;
  onStateChange?: (state: SceneState) => void;
}

class SceneControllerClass {
  private static instance: SceneControllerClass;
  private scenes: Map<string, Scene> = new Map();
  private scrollProgress: number = 0;
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): SceneControllerClass {
    if (!SceneControllerClass.instance) {
      SceneControllerClass.instance = new SceneControllerClass();
    }
    return SceneControllerClass.instance;
  }

  register(scene: Scene): void {
    this.scenes.set(scene.id, scene);
    if (import.meta.env.DEV) CinematicMonitor.setSceneCount(this.scenes.size);
  }

  update(scrollProgress: number): void {
    this.scrollProgress = scrollProgress;
    
    // Update all scene states based on scroll progress
    this.scenes.forEach(scene => {
      const newState = this.calculateSceneState(scene, scrollProgress);
      const currentState = this.getState(scene.id);
      
      if (currentState !== newState) {
        if (import.meta.env.DEV) {
          CinematicMonitor.recordSceneTransition(scene.id, currentState, newState, performance.now());
        }
        if (scene.onStateChange) scene.onStateChange(newState);
      }
    });

    // Notify listeners
    this.listeners.forEach(listener => listener());
  }

  private calculateSceneState(scene: Scene, progress: number): SceneState {
    if (progress < scene.scrollStart - 0.05 || progress > scene.scrollEnd + 0.05) {
      return 'inactive';
    }
    
    if (progress >= scene.scrollStart && progress <= scene.scrollEnd) {
      return 'primary';
    }
    
    return 'secondary';
  }

  getState(sceneId: string): SceneState {
    const scene = this.scenes.get(sceneId);
    if (!scene) return 'inactive';
    return this.calculateSceneState(scene, this.scrollProgress);
  }

  getScrollProgress(): number {
    return this.scrollProgress;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    if (import.meta.env.DEV) CinematicMonitor.setSceneSubscribers(this.listeners.size);
    return () => {
      this.listeners.delete(listener);
      if (import.meta.env.DEV) CinematicMonitor.setSceneSubscribers(this.listeners.size);
    };
  }

  reset(): void {
    this.scenes.clear();
    this.scrollProgress = 0;
    this.listeners.clear();
  }
}

export const SceneController = SceneControllerClass.getInstance();