import { useState, useEffect } from 'react';
import { SceneController } from './SceneController';
import type { SceneState } from './SceneController';

/** Returns scene state + raw 0–1 scroll progress for parallax use. */
export function useSceneProgress(sceneId: string): { state: SceneState; progress: number } {
  const [result, setResult] = useState<{ state: SceneState; progress: number }>(() => ({
    state: SceneController.getState(sceneId),
    progress: SceneController.getScrollProgress(),
  }));

  useEffect(() => {
    const unsubscribe = SceneController.subscribe(() => {
      setResult({
        state: SceneController.getState(sceneId),
        progress: SceneController.getScrollProgress(),
      });
    });
    return unsubscribe;
  }, [sceneId]);

  return result;
}
