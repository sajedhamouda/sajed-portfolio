import type { ReactNode } from 'react';
import { useScene } from './useScene';
import type { SceneState } from './SceneController';

interface SceneWrapperProps {
  sceneId: string;
  children: (state: SceneState) => ReactNode;
  className?: string;
}

export function SceneWrapper({ sceneId, children, className }: SceneWrapperProps) {
  const state = useScene(sceneId);

  return (
    <div 
      className={className}
      data-scene={sceneId}
      data-scene-state={state}
    >
      {children(state)}
    </div>
  );
}