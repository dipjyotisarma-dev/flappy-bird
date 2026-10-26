import { LOGICAL_W, MAX_GAP_DELTA, PIPE_SPACING, PIPE_W, gapForScore, speedForScore } from './constants';
import { DUSK } from './palette';
import { circleRectCollides, pipeRects, type Pipe } from './types';

export class PipeField {
  pipes: Pipe[] = [];

  reset(_viewW: number): void {
    this.pipes = [];
  }

  private randomGapY(gapH: number, playH: number, prevGapY?: number): number {
    // Keep gaps fully on screen with fair margins.
    const marginTop = 70 + gapH / 2;
    const marginBottom = 110 + gapH / 2;
    const lo = marginTop;
    const hi = playH - marginBottom + 70;
    const low = Math.min(lo, hi - 40);
    const high = Math.max(hi, lo + 40);
    const y = low + Math.random() * (high - low);
    // Clamp the vertical jump from the previous pipe so the bird can
    // always physically reach the next gap in time. Without this, two
    // consecutive gaps could spawn at opposite screen edges, creating an
    // effectively impassable wall.
    if (prevGapY === undefined) return y;
    const clampedLow = Math.max(low, prevGapY - MAX_GAP_DELTA);
    const clampedHigh = Math.min(high, prevGapY + MAX_GAP_DELTA);
    if (clampedHigh <= clampedLow) return Math.min(high, Math.max(low, prevGapY));
    return Math.min(clampedHigh, Math.max(clampedLow, y));
  }

  update(dt: number, score: number, scrolling: boolean, viewW: number, playH: number): void {
    if (!scrolling) return;
    const speed = speedForScore(score);
    for (const p of this.pipes) p.x -= speed * dt;
    this.pipes = this.pipes.filter((p) => p.x + PIPE_W > -20);
    // Seed the first pipe of a run. On wide screens it starts closer
    // so the player is not waiting seconds for the first obstacle.
    if (this.pipes.length === 0) {
      const gapH = gapForScore(score);
      const firstX = Math.max(LOGICAL_W + 20, viewW * 0.55);
      this.pipes.push({ x: firstX, gapY: this.randomGapY(gapH, playH), gapH, passed: false });
    }
    // Fill to the right edge anchored to the last pipe, so spacing is
    // always exactly PIPE_SPACING. The old spawnX-counter approach placed
    // new pipes at viewW + 20 regardless of where the previous pipe was,
    // which stacked overlapping pillars on wide screens and after resizes.
    let guard = 0;
    while (guard++ < 32) {
      const last = this.pipes[this.pipes.length - 1];
      if (!last) break;
      const nextX = last.x + PIPE_SPACING;
      if (nextX > viewW + 20) break;
      const gapH = gapForScore(score);
      this.pipes.push({ x: nextX, gapY: this.randomGapY(gapH, playH, last.gapY), gapH, passed: false });
    }
  }

  /** Returns number of newly passed pipes. */
  collectScore(birdX: number): number {
    let gained = 0;
    for (const p of this.pipes) {
      if (!p.passed && p.x + PIPE_W < birdX) {
        p.passed = true;
        gained += 1;
      }
    }
    return gained;
  }

  hitsBird(bx: number, by: number, br: number, playH: number): boolean {
    // Shrink hitbox slightly for fairness (forgiving edges).
    const fr = br - 1.5;
    for (const p of this.pipes) {
      const { top, bottom } = pipeRects(p.x, p.gapY, p.gapH, PIPE_W, playH);
      if (
        circleRectCollides(bx, by, fr, top.x + 2, top.y, top.w - 4, top.h) ||
        circleRectCollides(bx, by, fr, bottom.x + 2, bottom.y, bottom.w - 4, bottom.h)
      ) {
        return true;
      }
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, playH: number): void {
    for (const p of this.pipes) {
      const { top, bottom } = pipeRects(p.x, p.gapY, p.gapH, PIPE_W, playH);
      this.drawPipe(ctx, top.x, top.y, top.w, top.h, true);
      this.drawPipe(ctx, bottom.x, bottom.y, bottom.w, bottom.h, false);
    }
  }

  private drawPipe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isTop: boolean
  ): void {
    if (h <= 0) return;
    const capH = 22;
    const capOver = 4;

    // Body
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, DUSK.pipeDark);
    g.addColorStop(0.25, DUSK.pipeBody);
    g.addColorStop(0.75, DUSK.pipeCap);
    g.addColorStop(1, DUSK.pipeDark);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // Warm rim light on the sun side
    ctx.fillStyle = 'rgba(255, 178, 107, 0.35)';
    ctx.fillRect(x + w - 5, y, 3, h);

    // Cool shade on the left
    ctx.fillStyle = 'rgba(20, 12, 40, 0.35)';
    ctx.fillRect(x, y, 4, h);

    // Cap
    const capY = isTop ? y + h - capH : y;
    const capX = x - capOver;
    const capW = w + capOver * 2;
    const cg = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    cg.addColorStop(0, DUSK.pipeDark);
    cg.addColorStop(0.3, DUSK.pipeCap);
    cg.addColorStop(0.8, DUSK.pipeLight);
    cg.addColorStop(1, DUSK.pipeDark);
    ctx.fillStyle = cg;
    ctx.fillRect(capX, capY, capW, capH);
    ctx.strokeStyle = 'rgba(20,12,40,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(capX + 1, capY + 1, capW - 2, capH - 2);

    // Rim highlight under cap
    ctx.fillStyle = DUSK.pipeRim;
    if (isTop) ctx.fillRect(capX, capY + capH - 3, capW, 3);
    else ctx.fillRect(capX, capY, capW, 3);
  }
}
