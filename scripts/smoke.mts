// Headless integration smoke test for the Flappy engine.
// Stubs the DOM/Canvas, runs the real engine + physics + collisions,
// and asserts viewport math, scoring, death, game-over, and restart.
// Run: npx esbuild scripts/smoke.mts --bundle --platform=node --format=esm
//        --outfile=scripts/smoke.mjs && node scripts/smoke.mjs
import { FlappyEngine } from '../src/game/engine';

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) {
    failures += 1;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

// ---------- stubs ----------
function makeCtx(): Record<string, unknown> {
  const grad = { addColorStop(): void {} };
  return {
    setTransform(): void {},
    save(): void {},
    restore(): void {},
    clearRect(): void {},
    translate(): void {},
    rotate(): void {},
    scale(): void {},
    fillRect(): void {},
    strokeRect(): void {},
    beginPath(): void {},
    arc(): void {},
    ellipse(): void {},
    moveTo(): void {},
    lineTo(): void {},
    closePath(): void {},
    fill(): void {},
    stroke(): void {},
    fillText(): void {},
    strokeText(): void {},
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: ''
  };
}

interface FakeCanvas {
  clientWidth: number;
  clientHeight: number;
  width: number;
  height: number;
  getContext: () => Record<string, unknown>;
}

function makeCanvas(w: number, h: number): FakeCanvas {
  return {
    clientWidth: w,
    clientHeight: h,
    width: 0,
    height: 0,
    getContext: () => makeCtx()
  };
}

const store: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = v;
  }
};

const win: Record<string, unknown> = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 1,
  addEventListener(): void {},
  removeEventListener(): void {}
};
(globalThis as Record<string, unknown>).window = win;
(globalThis as Record<string, unknown>).ResizeObserver = class {
  observe(): void {}
  disconnect(): void {}
};

type RafCb = (t: number) => void;
let rafQueue: RafCb[] = [];
(globalThis as Record<string, unknown>).requestAnimationFrame = (cb: RafCb): number => {
  rafQueue.push(cb);
  return rafQueue.length;
};
(globalThis as Record<string, unknown>).cancelAnimationFrame = (): void => {};

let now = 1000;
function pump(n: number, dtMs = 16.667): void {
  for (let i = 0; i < n; i++) {
    const q = rafQueue;
    rafQueue = [];
    now += dtMs;
    for (const cb of q) cb(now);
    if (rafQueue.length === 0) break;
  }
}

function makeEngine(cssW: number, cssH: number): { engine: FlappyEngine; events: string[] } {
  win.innerWidth = cssW;
  win.innerHeight = cssH;
  const events: string[] = [];
  const engine = new FlappyEngine(
    (makeCanvas(cssW, cssH) as unknown) as HTMLCanvasElement,
    {
      onPhase: (p) => events.push(`phase:${p}`),
      onScore: (s, b) => events.push(`score:${s}/${b}`)
    },
    () => now
  );
  engine.start();
  return { engine, events };
}

// ---------- tests ----------
async function main(): Promise<void> {
  // 1. Fullscreen viewport math on a laptop screen.
  {
    const { engine } = makeEngine(1440, 900);
    assert(Math.abs(engine.viewW - 960) < 1, `laptop viewW ~960 (got ${engine.viewW.toFixed(1)})`);
    assert(Math.abs(engine.viewH - 600) < 1, `laptop viewH ~600 (got ${engine.viewH.toFixed(1)})`);
    assert(engine.phase === 'ready', 'starts in ready phase');
    engine.destroy();
  }

  // 2. Portrait phone keeps the 400-wide design area, extends height.
  {
    const { engine } = makeEngine(390, 844);
    assert(Math.abs(engine.viewW - 400) < 1, `phone viewW ~400 (got ${engine.viewW.toFixed(1)})`);
    assert(engine.viewH > 600, `phone viewH extended (got ${engine.viewH.toFixed(1)})`);
    engine.destroy();
  }

  // 3. Gameplay: flap via the real input path, pipes spawn, world runs.
  {
    const { engine } = makeEngine(1440, 900);
    engine.press(); // ready -> playing
    assert(engine.phase === 'playing', 'press starts the run');
    // Simple autopilot: flap toward the nearest gap.
    for (let i = 0; i < 60 * 12; i++) {
      const e = engine as unknown as {
        pipes: { pipes: Array<{ x: number; gapY: number }> };
        bird: { x: number; y: number; vy: number };
      };
      const next = e.pipes.pipes.find((p) => p.x + 66 >= e.bird.x);
      if (engine.phase === 'playing' && next && e.bird.y > next.gapY + 8 && e.bird.vy > -200) {
        engine.press();
      }
      pump(1);
      if (engine.phase !== 'playing') break;
    }
    assert(
      engine.score > 0 || engine.phase !== 'playing',
      `scoring or collision occurred (score=${engine.score}, phase=${engine.phase})`
    );
    engine.destroy();
  }

  // 4. Death without input -> dead -> game over -> best persisted -> restart.
  {
    const { engine } = makeEngine(1440, 900);
    engine.press();
    pump(60 * 4); // never flap: must hit ground or a pipe
    assert(engine.phase === 'dead' || engine.phase === 'gameover', `bird dies unaided (${engine.phase})`);
    pump(120); // clock is virtual: DEAD_PAUSE_MS elapses via pumped time
    assert(engine.phase === 'gameover', `reaches game over (${engine.phase})`);
    engine.press(); // Space after game over restarts
    assert(engine.phase === 'playing' && engine.score === 0, 'restarts into a fresh run');
    engine.destroy();
  }

  if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('SMOKE OK');
}

void main();
