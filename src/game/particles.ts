import type { Particle } from './types';

export class ParticleSystem {
  particles: Particle[] = [];

  clear(): void {
    this.particles = [];
  }

  burst(x: number, y: number, n: number, colors: string[], power = 160): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (0.35 + Math.random() * 0.85);
      const life = 0.45 + Math.random() * 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life,
        maxLife: life,
        size: 2 + Math.random() * 3.5,
        color: colors[i % colors.length],
        gravity: 700
      });
    }
  }

  flapPuff(x: number, y: number): void {
    this.burst(x, y, 5, ['rgba(255,246,232,0.9)', 'rgba(255,178,107,0.8)'], 90);
  }

  scoreSpark(x: number, y: number): void {
    this.burst(x, y, 10, ['#fff6e8', '#ffd28a', '#ff9a5a'], 130);
  }

  deathBurst(x: number, y: number): void {
    this.burst(x, y, 26, ['#ffc44d', '#ff7a45', '#fff6e8', '#ff5a3c'], 240);
  }

  update(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
