export type GamePhase = 'ready' | 'playing' | 'dead' | 'gameover';

export interface Pipe {
  x: number;
  gapY: number;
  gapH: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

/** Pure helper — circle vs axis-aligned rect. Unit-testable. */
export function circleRectCollides(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function pipeRects(
  pipeX: number,
  gapY: number,
  gapH: number,
  pipeW: number,
  playH: number
): { top: { x: number; y: number; w: number; h: number }; bottom: { x: number; y: number; w: number; h: number } } {
  const topH = Math.max(0, gapY - gapH / 2);
  const bottomY = gapY + gapH / 2;
  return {
    top: { x: pipeX, y: 0, w: pipeW, h: topH },
    bottom: { x: pipeX, y: bottomY, w: pipeW, h: Math.max(0, playH - bottomY) }
  };
}
