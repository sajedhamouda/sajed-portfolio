import { CinematicMonitor } from '../core/observability/CinematicMonitor';
type StatusCallback = (status: string) => void;

class BootSystemClass {
  private static instance: BootSystemClass;
  private isBooting = false;
  private bootComplete = false;
  private statusCallback?: StatusCallback;

  private constructor() {}

  static getInstance(): BootSystemClass {
    if (!BootSystemClass.instance) {
      BootSystemClass.instance = new BootSystemClass();
    }
    return BootSystemClass.instance;
  }

  setStatusCallback(cb: StatusCallback): void {
    this.statusCallback = cb;
  }

  async boot(): Promise<void> {
    // Guard: only one boot run, ever
    if (this.isBooting || this.bootComplete) return;
    this.isBooting = true;

    try {
      this.emit('DA VINCI STUDIO');
      await this.delay(1100);

      this.emit('COMPOSING EXPERIENCE');
      await this.delay(480);

      this.emit('CALIBRATING ATMOSPHERE');
      await this.delay(480);

      this.emit('ENTERING');
      await this.delay(320);

      this.bootComplete = true;
      if (import.meta.env.DEV) CinematicMonitor.setBootComplete(true);
    } catch {
      this.emit('—');
    } finally {
      this.isBooting = false;
    }
  }

  private emit(status: string): void {
    this.statusCallback?.(status);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isReady(): boolean {
    return this.bootComplete;
  }
}

export const BootSystemInstance = BootSystemClass.getInstance();
