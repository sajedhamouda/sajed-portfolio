export type SceneState = 'inactive' | 'secondary' | 'primary';

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
  }

  update(scrollProgress: number): void {
    this.scrollProgress = scrollProgress;
    
    // Update all scene states based on scroll progress
    this.scenes.forEach(scene => {
      const newState = this.calculateSceneState(scene, scrollProgress);
      const currentState = this.getState(scene.id);
      
      if (currentState !== newState && scene.onStateChange) {
        scene.onStateChange(newState);
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
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.scenes.clear();
    this.scrollProgress = 0;
    this.listeners.clear();
  }
}

export const SceneController = SceneControllerClass.getInstance();