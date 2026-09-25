/**
 * Master Timeline Director & Scene Coordinator
 * Coordinates camera viewport transitions, route drawing progression, story card triggers,
 * and audio-visual cue events across multi-city travel journeys.
 */

export interface SceneCue {
  id: string;
  timestampMs: number;
  type: 'PAN_TO_CITY' | 'ZOOM' | 'SHOW_CARD' | 'REVEAL_ROUTE' | 'PLAY_AUDIO';
  payload: Record<string, unknown>;
}

export class TimelineDirector {
  private cues: SceneCue[] = [];
  private currentTimeMs = 0;
  private durationMs = 0;
  private isPlaying = false;
  private triggeredCueIds: Set<string> = new Set();
  private onCueTrigger?: (cue: SceneCue) => void;

  constructor(cues: SceneCue[] = [], onCueTrigger?: (cue: SceneCue) => void) {
    this.setCues(cues);
    this.onCueTrigger = onCueTrigger;
  }

  public setCues(cues: SceneCue[]): void {
    this.cues = [...cues].sort((a, b) => a.timestampMs - b.timestampMs);
    this.durationMs = this.cues.length > 0 ? this.cues[this.cues.length - 1].timestampMs + 2000 : 0;
    this.reset();
  }

  public play(): void {
    this.isPlaying = true;
  }

  public pause(): void {
    this.isPlaying = false;
  }

  public reset(): void {
    this.currentTimeMs = 0;
    this.isPlaying = false;
    this.triggeredCueIds.clear();
  }

  public seek(targetMs: number): void {
    this.currentTimeMs = Math.max(0, Math.min(this.durationMs, targetMs));
    this.triggeredCueIds.clear();

    for (const cue of this.cues) {
      if (cue.timestampMs <= this.currentTimeMs) {
        this.triggeredCueIds.add(cue.id);
        this.onCueTrigger?.(cue);
      }
    }
  }

  public tick(deltaMs: number): void {
    if (!this.isPlaying) return;

    this.currentTimeMs += deltaMs;

    for (const cue of this.cues) {
      if (!this.triggeredCueIds.has(cue.id) && cue.timestampMs <= this.currentTimeMs) {
        this.triggeredCueIds.add(cue.id);
        this.onCueTrigger?.(cue);
      }
    }

    if (this.currentTimeMs >= this.durationMs) {
      this.isPlaying = false;
    }
  }

  public getProgress(): number {
    return this.durationMs > 0 ? Math.min(1.0, this.currentTimeMs / this.durationMs) : 0;
  }

  public getCurrentTime(): number {
    return this.currentTimeMs;
  }

  public getDuration(): number {
    return this.durationMs;
  }

  public isFinished(): boolean {
    return this.currentTimeMs >= this.durationMs && !this.isPlaying;
  }
}
