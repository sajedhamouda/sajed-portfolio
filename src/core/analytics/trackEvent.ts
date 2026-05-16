/**
 * trackEvent — thin wrapper over window.umami.track()
 *
 * Design goals:
 *   - Zero cost when Umami is not loaded (no error, no log)
 *   - Zero cost in development (import.meta.env.DEV guard)
 *   - No external dependency — just calls the global window.umami object
 *   - Typed event catalogue to prevent typos and encourage consistency
 *
 * Usage:
 *   import { trackEvent } from '../core/analytics/trackEvent';
 *   trackEvent('scene_reached', { scene: 'cta' });
 */

export type EventName =
  | 'scene_reached'       // user's scroll reaches a scene for the first time
  | 'cta_click'           // primary CTA button clicked
  | 'whatsapp_click'      // WhatsApp CTA clicked
  | 'case_study_open'     // case study link clicked (from portfolio footer)
  | 'email_click'         // mailto link clicked
  | 'linkedin_click'      // LinkedIn link clicked
  | 'architecture_open'   // architecture page link clicked (from case study)
  | 'boot_complete'       // cinematic boot sequence completed successfully
  | 'webgl_failed'        // ThreeCanvas WebGL init failed (graceful degradation)
  | 'scroll_complete';    // user scrolled to 100% of the page

export interface EventPayload {
  scene?:    string;
  label?:    string;
  value?:    number;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

/**
 * Fire an analytics event.
 * No-op in development and when Umami is not loaded.
 */
export function trackEvent(name: EventName, payload?: EventPayload): void {
  if (import.meta.env.DEV) return;
  if (typeof window === 'undefined') return;
  if (!window.umami?.track) return;

  try {
    window.umami.track(name, payload as Record<string, string | number | boolean>);
  } catch {
    // analytics must never throw
  }
}

/**
 * Track scene depth — called the first time each scene reaches 'primary' state.
 * Uses a Set to fire only once per scene per session.
 */
const _trackedScenes = new Set<string>();

export function trackSceneReached(sceneId: string): void {
  if (_trackedScenes.has(sceneId)) return;
  _trackedScenes.add(sceneId);
  trackEvent('scene_reached', { scene: sceneId });
}
