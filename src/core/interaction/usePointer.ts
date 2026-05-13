import { useEffect, useRef } from 'react';
import { PointerEngine, type PointerState } from './PointerEngine';

/**
 * usePointer — Subscribe to PointerEngine without React re-renders.
 *
 * Returns a stable ref to the latest PointerState.
 * Use this when you need pointer data in imperative DOM callbacks
 * (e.g. direct style writes) to avoid re-render on every frame.
 *
 * For components that DO need re-renders (rare), use usePointerState instead.
 */
export function usePointer(
  onFrame: (state: PointerState) => void
): void {
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    const unsub = PointerEngine.subscribe((state) => {
      cbRef.current(state);
    });
    return unsub;
  }, []);
}
