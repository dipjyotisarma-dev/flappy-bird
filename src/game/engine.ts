import { SoundFX } from './audio';
import { Background } from './background';
import { Bird } from './bird';
import {
  BIRD_X,
  DEAD_PAUSE_MS,
  GROUND_H,
  LOGICAL_H,
  LOGICAL_W,
  SHAKE_MS,
  SHAKE_PX,
  speedForScore
} from './constants';
import { DUSK } from './palette';
import { PipeField } from './pipes';
import { ParticleSystem } from './particles';
import { loadBest, saveBest } from './storage';
import type { GamePhase } from './types';

function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors if unsupported/disallowed
    }
  }
}

export interface EngineCallbacks {
  onPhase: (p: GamePhase) => void;
  onScore: (score: number, best: number) => void;
}

export class FlappyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;
  private resizeObserver: ResizeObserver | null = null;

  private bg = new Background();
  private bird = new Bird();
  private pipes = new PipeField();
  private fx = new ParticleSystem();
  readonly sound = new SoundFX();

  phase: GamePhase = 'ready';
  score = 0;
  best = loadBest();
  /** Dynamic logical viewport — always contains the 400x600 design area. */
  viewW = LOGICAL_W;
  viewH = LOGICAL_H;
  private idleT = 0;
  private deadAt = 0;
  private gameoverAt = 0;
  private shakeT = 0;
  private scorePop = 0;
  private cb: EngineCallbacks;
  private clock: () => number;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks, clock: () => number = () => performance.now()) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    this.ctx = ctx;
    this.cb = cb;
    this.clock = clock;
    this.resize();
    this.bird.reset(this.startY());
    this.pipes.reset(this.viewW);
    this.bindResize();
  }

  private get playH(): number {
    return this.viewH - GROUND_H;
  }

  private startY(): number {
    return this.playH * 0.54;
  }

  private handleOrientation = (): void => {
    this.resize();
    setTimeout(this.resize, 100);
  };

  private bindResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    window.addEventListener('orientationchange', this.handleOrientation);
    window.addEventListener('resize', this.resize);
  }

  private resize = (): void => {
    const cssW = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const cssH = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    // Contain the 400x600 design area: extra space extends the viewport
    // instead of stretching physics or hitboxes.
    const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
    this.viewW = cssW / scale;
    this.viewH = cssH / scale;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    this.bg.onResize(this.viewW, this.viewH);
    // Keep the bird valid across resizes.
    if (this.phase === 'ready') {
      this.bird.reset(this.startY());
      this.pipes.reset(this.viewW);
    } else {
      const groundY = this.playH - this.bird.r;
      if (this.bird.y > groundY) this.bird.y = groundY;
    }
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = this.clock();
    const loop = (): void => {
      if (!this.running) return;
      const now = this.clock();
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.033) dt = 0.033;
      if (dt < 0) dt = 0;
      this.update(dt, now);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    window.removeEventListener('orientationchange', this.handleOrientation);
    window.removeEventListener('resize', this.resize);
  }

  private setPhase(p: GamePhase): void {
    this.phase = p;
    this.cb.onPhase(p);
  }

  /** Primary player action: Space / click / tap. */
  press(): void {
    this.sound.unlock();
    if (this.phase === 'ready') {
      this.setPhase('playing');
      this.bird.flap();
      this.fx.flapPuff(BIRD_X - 10, this.bird.y + 8);
      this.sound.flap();
      vibrate(8);
    } else if (this.phase === 'playing') {
      this.bird.flap();
      this.fx.flapPuff(BIRD_X - 10, this.bird.y + 8);
      this.sound.flap();
      vibrate(8);
    } else if (this.phase === 'gameover') {
      const now = this.clock();
      if (now - this.gameoverAt > 500) this.restartRun();
    }
    // 'dead' — ignore input during fall/flash.
  }

  restartRun(): void {
    this.score = 0;
    this.cb.onScore(0, this.best);
    this.bird.reset(this.startY());
    this.pipes.reset(this.viewW);
    this.fx.clear();
    this.shakeT = 0;
    this.scorePop = 0;
    this.setPhase('playing');
    this.bird.flap();
    this.sound.swoosh();
  }

  resetToReady(): void {
    this.score = 0;
    this.cb.onScore(0, this.best);
    this.bird.reset(this.startY());
    this.pipes.reset(this.viewW);
    this.fx.clear();
    this.shakeT = 0;
    this.setPhase('ready');
  }

  private killBird(hitPipe: boolean): void {
    if (this.phase !== 'playing') return;
    this.setPhase('dead');
    this.deadAt = this.clock();
    this.shakeT = SHAKE_MS / 1000;
    this.bird.alive = false;
    if (hitPipe) this.bird.vy = Math.min(this.bird.vy, -260);
    this.fx.deathBurst(this.bird.x, this.bird.y);
    this.sound.hit();
    vibrate([35, 25, 35]);
    if (this.score > this.best) {
      this.best = this.score;
      saveBest(this.best);
      this.cb.onScore(this.score, this.best);
    }
  }

  private update(dt: number, now: number): void {
    const playing = this.phase === 'playing';
    const scrolling = this.phase === 'playing' || this.phase === 'ready';
    const speed = speedForScore(this.score);
    const playH = this.playH;

    this.idleT += dt;
    if (this.scorePop > 0) this.scorePop -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;

    this.bg.update(dt, scrolling, playing ? speed : 40, this.viewW);
    this.bird.update(dt, playing || this.phase === 'dead', this.idleT);
    this.fx.update(dt);

    if (this.phase === 'ready') {
      this.pipes.reset(this.viewW);
      return;
    }

    if (playing) {
      this.pipes.update(dt, this.score, true, this.viewW, playH);
      const gained = this.pipes.collectScore(BIRD_X);
      if (gained > 0) {
        this.score += gained;
        this.scorePop = 0.35;
        this.cb.onScore(this.score, this.best);
        this.fx.scoreSpark(BIRD_X + 30, this.bird.y - 30);
        this.sound.score();
        vibrate(15);
      }
      // Ceiling: clamp, never die on top.
      if (this.bird.y < this.bird.r) {
        this.bird.y = this.bird.r;
        this.bird.vy = Math.max(this.bird.vy, 0);
      }
      const groundY = playH - this.bird.r;
      if (this.bird.y >= groundY) {
        this.bird.y = groundY;
        this.killBird(false);
        return;
      }
      if (this.pipes.hitsBird(this.bird.x, this.bird.y, this.bird.r, playH)) {
        this.killBird(true);
        return;
      }
    } else if (this.phase === 'dead') {
      // Let the bird fall to the ground, then show game over.
      this.pipes.update(dt, this.score, false, this.viewW, playH);
      const groundY = playH - this.bird.r;
      if (this.bird.y < groundY) {
        this.bird.vy = Math.min(900, this.bird.vy + 2200 * dt);
        this.bird.y = Math.min(groundY, this.bird.y + this.bird.vy * dt);
      }
      if (now - this.deadAt >= DEAD_PAUSE_MS && this.bird.y >= groundY - 0.5) {
        this.setPhase('gameover');
        this.gameoverAt = now;
      }
    }
    // gameover: world frozen except clouds/particles settling.
  }

  private render(): void {
    const { ctx } = this;
    ctx.save();
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    if (this.shakeT > 0) {
      const t = this.shakeT / (SHAKE_MS / 1000);
      const m = SHAKE_PX * t;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    this.bg.draw(ctx, this.viewW, this.viewH);
    this.pipes.draw(ctx, this.playH);
    this.bg.drawGround(ctx, this.viewW, this.viewH);
    this.fx.draw(ctx);
    this.bird.draw(ctx);

    // In-canvas score (avoids React re-render every frame for visuals;
    // React state still updates via callback for menus).
    if (this.phase === 'playing' || this.phase === 'dead') {
      const pop = this.scorePop > 0 ? 1 + this.scorePop * 0.5 : 1;
      ctx.save();
      ctx.translate(this.viewW / 2, 92);
      ctx.scale(pop, pop);
      ctx.font = '900 44px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = DUSK.scoreShadow;
      ctx.strokeText(String(this.score), 0, 0);
      ctx.fillStyle = DUSK.scoreText;
      ctx.fillText(String(this.score), 0, 0);
      ctx.restore();
    }

    // Screen stays uncluttered — score only.

    ctx.restore();
  }
}
