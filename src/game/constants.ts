// Design minimums. The engine contains this area and extends the logical
// viewport to fill any screen, so physics and hitboxes never stretch.
export const LOGICAL_W = 400;
export const LOGICAL_H = 600;
export const GROUND_H = 84;

export const BIRD_X = 118;
export const BIRD_R = 12;

export const GRAVITY = 1850;
export const FLAP_VY = -540;
export const MAX_FALL = 680;

export const PIPE_W = 66;
export const PIPE_SPACING = 280;
export const BASE_SPEED = 182;
export const MAX_SPEED = 305;
export const SPEED_PER_POINT = 2.6;
export const BASE_GAP = 154;
export const MIN_GAP = 132;
export const GAP_SHRINK_PER_POINT = 0.8;
// Max vertical distance between two consecutive gaps. Guarantees the next
// opening is always physically reachable in the time between pipes.
export const MAX_GAP_DELTA = 170;

export const PIPE_MARGIN_TOP = 70;
export const DEAD_PAUSE_MS = 650;
export const SHAKE_MS = 280;
export const SHAKE_PX = 7;

export function speedForScore(score: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + score * SPEED_PER_POINT);
}

export function gapForScore(score: number): number {
  return Math.max(MIN_GAP, BASE_GAP - score * GAP_SHRINK_PER_POINT);
}
