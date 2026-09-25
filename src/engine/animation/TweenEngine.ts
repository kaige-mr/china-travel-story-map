/**
 * Keyframe Animation & Tweening Engine
 * Provides comprehensive mathematical easing curves, timeline playback controls,
 * speed multipliers, and delta-time compensation for canvas map route animations.
 */

export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInExpo: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number): number => (t === 1 ? 1 : -Math.pow(2, -10 * t) + 1),
  easeOutElastic: (t: number): number => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
};

export interface TweenOptions {
  durationMs: number;
  easing?: EasingFunction;
  onUpdate?: (progress: number, value: number) => void;
  onComplete?: () => void;
  loop?: boolean;
}

export class Tween {
  private startVal: number;
  private endVal: number;
  private durationMs: number;
  private easing: EasingFunction;
  private onUpdate?: (progress: number, value: number) => void;
  private onComplete?: () => void;
  private loop: boolean;

  private elapsedMs = 0;
  private isRunning = false;
  private speed = 1.0;

  constructor(start: number, end: number, options: TweenOptions) {
    this.startVal = start;
    this.endVal = end;
    this.durationMs = Math.max(1, options.durationMs);
    this.easing = options.easing ?? Easing.easeInOutCubic;
    this.onUpdate = options.onUpdate;
    this.onComplete = options.onComplete;
    this.loop = options.loop ?? false;
  }

  public start(): void {
    this.isRunning = true;
    this.elapsedMs = 0;
  }

  public pause(): void {
    this.isRunning = false;
  }

  public resume(): void {
    this.isRunning = true;
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, speed);
  }

  public seek(progress: number): void {
    const clamped = Math.max(0, Math.min(1, progress));
    this.elapsedMs = clamped * this.durationMs;
    const eased = this.easing(clamped);
    const value = this.startVal + eased * (this.endVal - this.startVal);
    this.onUpdate?.(clamped, value);
  }

  public update(deltaMs: number): boolean {
    if (!this.isRunning) return false;

    this.elapsedMs += deltaMs * this.speed;
    const rawProgress = this.elapsedMs / this.durationMs;

    if (rawProgress >= 1.0) {
      const finalVal = this.endVal;
      this.onUpdate?.(1.0, finalVal);
      this.onComplete?.();

      if (this.loop) {
        this.elapsedMs = 0;
        return true;
      } else {
        this.isRunning = false;
        return false;
      }
    }

    const eased = this.easing(rawProgress);
    const currentVal = this.startVal + eased * (this.endVal - this.startVal);
    this.onUpdate?.(rawProgress, currentVal);
    return true;
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

export class TweenGroup {
  private tweens: Set<Tween> = new Set();

  public add(tween: Tween): void {
    this.tweens.add(tween);
  }

  public remove(tween: Tween): void {
    this.tweens.delete(tween);
  }

  public update(deltaMs: number): void {
    for (const t of this.tweens) {
      const active = t.update(deltaMs);
      if (!active) {
        this.tweens.delete(t);
      }
    }
  }

  public clear(): void {
    this.tweens.clear();
  }

  public size(): number {
    return this.tweens.size;
  }
}
