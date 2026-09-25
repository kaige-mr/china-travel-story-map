import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../ParticleSystem';

describe('ParticleSystem Canvas Emitter', () => {
  it('emits destination pulse rings and updates particle life', () => {
    const ps = new ParticleSystem(100);
    expect(ps.count()).toBe(0);

    ps.emitPulseRing(150, 150);
    expect(ps.count()).toBe(24);

    ps.update();
    expect(ps.count()).toBe(24);
  });

  it('decays and removes dead particles over lifecycle', () => {
    const ps = new ParticleSystem(100);
    ps.emit({
      x: 0,
      y: 0,
      count: 5,
      speed: 1,
      spread: 1,
      color: '#fff',
      sizeRange: [2, 2],
      lifeRange: [2, 2]
    });

    expect(ps.count()).toBe(5);
    ps.update();
    expect(ps.count()).toBe(5);
    ps.update();
    expect(ps.count()).toBe(0); // all dead
  });
});
