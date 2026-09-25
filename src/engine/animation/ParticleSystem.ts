/**
 * Canvas 2D Particle Emitter System
 * Produces interactive visual effects: destination pulse waves, flight trail sparks,
 * and celebration confetti upon itinerary completion.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface EmitterConfig {
  x: number;
  y: number;
  count: number;
  speed: number;
  spread: number;    // Angle spread in radians
  baseAngle?: number;
  color: string;
  sizeRange: [number, number];
  lifeRange: [number, number];
  gravity?: number;
  decay?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles: number;

  constructor(maxParticles = 500) {
    this.maxParticles = maxParticles;
  }

  public emit(config: EmitterConfig): void {
    const baseAngle = config.baseAngle ?? 0;
    const gravity = config.gravity ?? 0;

    for (let i = 0; i < config.count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = baseAngle + (Math.random() - 0.5) * config.spread;
      const speed = config.speed * (0.5 + Math.random() * 0.8);
      const life = config.lifeRange[0] + Math.random() * (config.lifeRange[1] - config.lifeRange[0]);
      const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

      let p = this.pool.pop();
      if (!p) {
        p = {
          x: config.x,
          y: config.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          size,
          color: config.color,
          alpha: 1.0
        };
      } else {
        p.x = config.x;
        p.y = config.y;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.life = life;
        p.maxLife = life;
        p.size = size;
        p.color = config.color;
        p.alpha = 1.0;
      }

      this.particles.push(p);
    }
  }

  public emitPulseRing(x: number, y: number, color = 'rgba(235, 94, 40, 0.8)'): void {
    this.emit({
      x,
      y,
      count: 24,
      speed: 1.8,
      spread: Math.PI * 2,
      color,
      sizeRange: [2, 4],
      lifeRange: [30, 50],
      gravity: 0
    });
  }

  public emitConfetti(x: number, y: number): void {
    const colors = ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0', '#fee440'];
    for (const c of colors) {
      this.emit({
        x,
        y,
        count: 10,
        speed: 3.5,
        spread: Math.PI * 2,
        color: c,
        sizeRange: [3, 6],
        lifeRange: [60, 90],
        gravity: 0.08
      });
    }
  }

  public update(gravity = 0): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        if (this.pool.length < 200) {
          this.pool.push(p);
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  public clear(): void {
    this.particles = [];
  }

  public count(): number {
    return this.particles.length;
  }
}
