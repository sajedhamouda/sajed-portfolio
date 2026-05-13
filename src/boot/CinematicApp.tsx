import { SceneController } from '../core/scene-engine/SceneController';
import { ScrollEngine } from '../core/scroll/ScrollEngine';
import { createScene } from '../core/scene-engine/SceneRegistry';

/**
 * Registers all scenes and initializes the ScrollEngine.
 * Does NOT start the boot sequence — that is owned by App.tsx via BootSystem.
 */
export function initializeCinematicExperience(): void {
  // Register all scenes with the SceneController singleton
  const sceneIds = ['hero', 'philosophy', 'services', 'work', 'logos', 'cta'] as const;
  sceneIds.forEach(id => {
    SceneController.register(createScene(id));
  });

  // Initialize scroll engine (Lenis created, RAF started, Lenis stopped until boot finishes)
  ScrollEngine.initialize();
}
