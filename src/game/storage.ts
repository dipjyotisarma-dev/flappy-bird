const KEY = 'flappy-dusk-best-v1';

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBest(v: number): void {
  try {
    localStorage.setItem(KEY, String(v));
  } catch {
    // private mode — ignore
  }
}
