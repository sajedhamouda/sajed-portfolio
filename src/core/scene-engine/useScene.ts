import { useState, useEffect } from 'react';
import { SceneController } from './SceneController';
import type { SceneState } from './SceneController';

export function useScene(sceneId: string): SceneState {
  const [state, setState] = useState<SceneState>(() => 
    SceneController.getState(sceneId)
  );

  useEffect(() => {
    const unsubscribe = SceneController.subscribe(() => {
      setState(SceneController.getState(sceneId));
    });

    return unsubscribe;
  }, [sceneId]);

  return state;
}