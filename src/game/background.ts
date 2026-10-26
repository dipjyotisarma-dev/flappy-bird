import { GROUND_H } from './constants';
import { DUSK } from './palette';

interface Cloud {
  x: number;
  y: number;
  s: number;
  v: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number;
}

export class Background {
  scrollX = 0;
  private clouds: Cloud[] = [];
  private stars: Star[] = [];
  private t = 0;

  constructor() {
    this.onResize(400, 600);
    // Scatter initially so the first frame is already populated.
    for (const c of this.clouds) c.x = Math.random() * 400;
  }

  /** Top up clouds/stars so wider/taller viewports stay covered. */
  onResize(w: number, h: number): void {
    const wantClouds = Math.max(7, Math.ceil(w / 110));
    while (this.clouds.length < wantClouds) {
      this.clouds.push({
        x: Math.random() * w,
        y: 40 + Math.random() * Math.min(240, h * 0.35),
        s: 0.6 + Math.random() * 1.1,
        v: 6 + Math.random() * 10
      });
    }
    const wantStars = Math.max(46, Math.ceil(w / 9));
    while (this.stars.length < wantStars) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.4,
        r: 0.6 + Math.random() * 1.2,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  reset(): void {
    this.scrollX = 0;
  }

  update(dt: number, scrolling: boolean, speed: number, viewW: number): void {
    this.t += dt;
    if (scrolling) this.scrollX += speed * dt;
    for (const c of this.clouds) {
      c.x -= c.v * dt;
      if (c.x < -90) {
        c.x = viewW + 90;
        c.y = 40 + Math.random() * 200;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    const W = viewW;
    const H = viewH;
    const groundY = H - GROUND_H;

    // Dusk sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, DUSK.skyTop);
    sky.addColorStop(0.42, DUSK.skyMid);
    sky.addColorStop(0.72, DUSK.skyLow);
    sky.addColorStop(0.88, DUSK.horizon);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Stars (top only)
    for (const s of this.stars) {
      if (s.x > W) continue;
      const a = 0.35 + 0.35 * Math.sin(this.t * 2 + s.tw);
      ctx.globalAlpha = Math.max(0, a) * (1 - s.y / 260);
      ctx.fillStyle = DUSK.star;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Sun — low on the horizon
    const sunX = W * 0.68;
    const sunY = groundY - 128;
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 90);
    glow.addColorStop(0, 'rgba(255,217,160,0.9)');
    glow.addColorStop(0.35, DUSK.sunGlow);
    glow.addColorStop(1, 'rgba(255,154,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DUSK.sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
    ctx.fill();
    // Sun clipped by far hills
    ctx.fillStyle = 'rgba(255,154,90,0.25)';
    ctx.beginPath();
    ctx.arc(sunX, sunY + 10, 26, 0, Math.PI);
    ctx.fill();

    // Clouds — dark silhouettes with warm underlight
    for (const c of this.clouds) {
      ctx.fillStyle = DUSK.cloudDark;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 34 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 20 * c.s, c.y + 4 * c.s, 20 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 22 * c.s, c.y + 3 * c.s, 22 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = DUSK.cloudWarm;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 6 * c.s, 30 * c.s, 5 * c.s, 0, 0, Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    this.drawHills(ctx, W, groundY, 0.25, DUSK.hillFar, 150, 34);
    this.drawHills(ctx, W, groundY, 0.5, DUSK.hillNear, 120, 52);
    this.drawCity(ctx, W, groundY);
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    W: number,
    groundY: number,
    par: number,
    color: string,
    baseY: number,
    amp: number
  ): void {
    const off = (this.scrollX * par) % W;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-8, groundY);
    for (let x = -W; x <= W * 2; x += 8) {
      const wx = x - off;
      const y = groundY - baseY * 0.4 - Math.abs(Math.sin((x + off * 0.5) * 0.018)) * amp;
      ctx.lineTo(wx, y);
    }
    ctx.lineTo(W + 8, groundY);
    ctx.closePath();
    ctx.fill();
  }

  private drawCity(ctx: CanvasRenderingContext2D, W: number, groundY: number): void {
    const off = (this.scrollX * 0.65) % 120;
    ctx.fillStyle = DUSK.city;
    const base: Array<[number, number, number]> = [
      [0, 26, 60],
      [34, 40, 44],
      [70, 30, 70],
      [108, 46, 52]
    ];
    const blocks = Math.ceil(W / 120) + 1;
    for (let k = -1; k < blocks; k++) {
      for (const [bx, bw, bh] of base) {
        const x = bx + k * 120 - off;
        ctx.fillRect(x, groundY - bh, bw, bh);
        // A few lit windows
        ctx.fillStyle = DUSK.cityWindow;
        ctx.globalAlpha = 0.75;
        for (let wy = groundY - bh + 8; wy < groundY - 8; wy += 12) {
          for (let wx = x + 5; wx < x + bw - 5; wx += 10) {
            if ((wx * 7 + wy * 13) % 3 === 0) ctx.fillRect(wx, wy, 3, 4);
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = DUSK.city;
      }
    }
  }

  drawGround(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const groundY = H - GROUND_H;
    ctx.fillStyle = DUSK.groundBase;
    ctx.fillRect(0, groundY, W, GROUND_H);
    // Top edge — sunset rim
    ctx.fillStyle = DUSK.groundTop;
    ctx.fillRect(0, groundY, W, 12);
    ctx.fillStyle = DUSK.groundEdge;
    ctx.fillRect(0, groundY, W, 3);
    // Scrolling stripes
    const off = this.scrollX % 36;
    ctx.fillStyle = DUSK.groundStripe;
    for (let x = -off; x < W; x += 36) {
      ctx.fillRect(x, groundY + 24, 18, 8);
      ctx.fillRect(x + 8, groundY + 48, 18, 8);
    }
  }
}
