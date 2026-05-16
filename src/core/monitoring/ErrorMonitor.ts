/**
 * ErrorMonitor — lightweight production error capture
 *
 * Captures:
 *   - Unhandled JS errors (window.onerror)
 *   - Unhandled promise rejections (window.onunhandledrejection)
 *   - Manual error reports from engine code (ErrorMonitor.report())
 *
 * On error:
 *   1. Fires an analytics event if Umami is loaded (non-fatal errors are labelled)
 *   2. Logs to console in dev (no-op in production except analytics)
 *   3. Never throws — error monitoring must be silent
 *
 * Mount once from App.tsx useEffect. Unmount on cleanup.
 */

import { trackEvent } from '../analytics/trackEvent';

type ErrorCategory =
  | 'js_error'
  | 'promise_rejection'
  | 'webgl_failed'
  | 'asset_load_failed'
  | 'engine_init_failed';

interface ErrorReport {
  category: ErrorCategory;
  message:  string;
  source?:  string;
}

class ErrorMonitorClass {
  private _mounted = false;
  private _onerror:              OnErrorEventHandler = null;
  private _onunhandledrejection: ((e: PromiseRejectionEvent) => void) | null = null;

  mount(): void {
    if (this._mounted || typeof window === 'undefined') return;
    this._mounted = true;

    this._onerror = (message, source, lineno, colno, error) => {
      this._capture({
        category: 'js_error',
        message:  String(error?.message ?? message).slice(0, 200),
        source:   `${String(source ?? '').split('/').pop()}:${lineno}:${colno}`,
      });
      return false; // don't suppress default browser error handling
    };

    this._onunhandledrejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason);
      this._capture({
        category: 'promise_rejection',
        message:  msg.slice(0, 200),
      });
    };

    window.onerror              = this._onerror;
    window.addEventListener('unhandledrejection', this._onunhandledrejection);
  }

  unmount(): void {
    if (!this._mounted) return;
    this._mounted = false;
    if (this._onerror) window.onerror = null;
    if (this._onunhandledrejection) {
      window.removeEventListener('unhandledrejection', this._onunhandledrejection);
    }
  }

  /** Report a known error from engine code (WebGL failure, asset 404, etc.) */
  report(category: ErrorCategory, message: string, source?: string): void {
    this._capture({ category, message: message.slice(0, 200), source });
  }

  private _capture(report: ErrorReport): void {
    if (import.meta.env.DEV) {
      console.warn('[ErrorMonitor]', report.category, report.message, report.source ?? '');
      return;
    }
    try {
      if (report.category === 'webgl_failed') {
        trackEvent('webgl_failed', { label: report.message });
      }
      // All other errors: no separate analytics event — they're low-signal in production.
      // Add specific events here only when actionable.
    } catch {
      // analytics must never throw
    }
  }
}

export const ErrorMonitor = new ErrorMonitorClass();
