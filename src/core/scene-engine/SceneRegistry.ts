import type { Scene } from './SceneController';

export const SCENE_REGISTRY: Record<string, { start: number; end: number }> = {
  hero: { start: 0.0, end: 0.15 },
  philosophy: { start: 0.12, end: 0.35 },
  services: { start: 0.32, end: 0.55 },
  work: { start: 0.52, end: 0.78 },
  logos: { start: 0.75, end: 0.9 },
  cta: { start: 0.88, end: 1.0 }
};

export function createScene(id: keyof typeof SCENE_REGISTRY, onStateChange?: (state: 'inactive' | 'secondary' | 'primary') => void): Scene {
  const config = SCENE_REGISTRY[id];
  if (!config) {
    throw new Error(`Scene configuration not found for: ${id}`);
  }
  
  return {
    id,
    scrollStart: config.start,
    scrollEnd: config.end,
    onStateChange
  };
}

