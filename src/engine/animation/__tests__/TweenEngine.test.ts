import { describe, it, expect } from 'vitest';
import { Tween, Easing, TweenGroup } from '../TweenEngine';

describe('TweenEngine & Easing Controllers', () => {
  it('updates linear progress from 0 to 1', () => {
    let currentVal = 0;
    const tween = new Tween(0, 100, {
      durationMs: 1000,
      easing: Easing.linear,
      onUpdate: (_, val) => { currentVal = val; }
    });

    tween.start();
    tween.update(500);
    expect(currentVal).toBeCloseTo(50, 1);

    tween.update(500);
    expect(currentVal).toBeCloseTo(100, 1);
  });

  it('handles pause and resume', () => {
    let currentVal = 0;
    const tween = new Tween(0, 100, {
      durationMs: 1000,
      onUpdate: (_, val) => { currentVal = val; }
    });

    tween.start();
    tween.update(200);
    expect(currentVal).toBeGreaterThan(0);
    const checkpoint = currentVal;

    tween.pause();
    tween.update(200);
    expect(currentVal).toBe(checkpoint); // did not change while paused

    tween.resume();
    tween.update(200);
    expect(currentVal).toBeGreaterThan(checkpoint);
  });

  it('seeks to exact fractional progress', () => {
    let currentVal = 0;
    const tween = new Tween(0, 200, {
      durationMs: 1000,
      easing: Easing.linear,
      onUpdate: (_, val) => { currentVal = val; }
    });

    tween.seek(0.75);
    expect(currentVal).toBe(150);
  });

  it('manages collections through TweenGroup', () => {
    const group = new TweenGroup();
    const t1 = new Tween(0, 10, { durationMs: 100 });
    const t2 = new Tween(0, 20, { durationMs: 100 });

    t1.start();
    t2.start();
    group.add(t1);
    group.add(t2);
    expect(group.size()).toBe(2);

    group.update(150); // finishes both
    expect(group.size()).toBe(0);
  });
});
