import { useCallback, useRef, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import type { FlappyEngine } from './game/engine';
import { loadBest } from './game/storage';
import type { GamePhase } from './game/types';

export default function App() {
  const engineRef = useRef<FlappyEngine | null>(null);
  const [phase, setPhase] = useState<GamePhase>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => loadBest());
  const [muted, setMuted] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  const handlePhase = useCallback((p: GamePhase) => {
    setPhase(p);
  }, []);

  const handleScore = useCallback((s: number, b: number) => {
    setScore(s);
    setBest((prev) => Math.max(prev, b));
    if (s === 0) {
      setIsNewBest(false);
    } else if (b > 0 && s >= b) {
      setIsNewBest(true);
    }
  }, []);

  const startOrFlap = useCallback((e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (e && 'currentTarget' in e && (e.currentTarget as HTMLElement)?.blur) {
      (e.currentTarget as HTMLElement).blur();
    }
    engineRef.current?.press();
  }, []);

  const restart = useCallback((e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (e && 'currentTarget' in e && (e.currentTarget as HTMLElement)?.blur) {
      (e.currentTarget as HTMLElement).blur();
    }
    setIsNewBest(false);
    engineRef.current?.restartRun();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    setMuted((m) => {
      const next = !m;
      engineRef.current?.sound.setMuted(next);
      if (!next) {
        engineRef.current?.sound.unlock();
      }
      return next;
    });
  }, []);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          <h1>Flappy Dusk</h1>
        </div>
        <div className="top-actions">
          <div className="best-pill" title="Best score">
            Best <strong>{best}</strong>
          </div>
          <button className="icon-btn" onClick={toggleMute} aria-label={muted ? 'Unmute sound' : 'Mute sound'}>
            {muted ? 'Muted' : 'Sound on'}
          </button>
        </div>
      </header>

      <main className="stage">
        <div className="frame">
          <GameCanvas engineRef={engineRef} onPhase={handlePhase} onScore={handleScore} />

          {phase === 'ready' && (
            <div
              className="overlay"
              role="button"
              tabIndex={-1}
              aria-label="Tap anywhere to take off"
              onPointerDown={(e) => {
                e.preventDefault();
                startOrFlap(e);
              }}
            >
              <div className="panel">
                <p className="kicker">Dusk flight</p>
                <h2>Ready?</h2>
                <p className="hint">
                  <span className="desktop-hint">
                    Press <kbd>Space</kbd>, click, or tap to flap.
                  </span>
                  <span className="mobile-hint">
                    Tap anywhere to flap.
                  </span>
                  <br />
                  Thread the pipes. Don't kiss the ground.
                </p>
                <button
                  className="primary"
                  onClick={startOrFlap}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    startOrFlap(e);
                  }}
                >
                  Take off
                </button>
                <p className="sub">Best: {best}</p>
              </div>
            </div>
          )}

          {phase === 'gameover' && (
            <div
              className="overlay"
              role="button"
              tabIndex={-1}
              aria-label="Tap anywhere to fly again"
              onPointerDown={(e) => {
                e.preventDefault();
                engineRef.current?.press();
              }}
            >
              <div className="panel">
                <p className="kicker">Run over</p>
                <h2>Game over</h2>
                <div className="scores">
                  <div className="score-box">
                    <span>Score</span>
                    <strong>{score}</strong>
                  </div>
                  <div className="score-box">
                    <span>Best</span>
                    <strong>{best}</strong>
                  </div>
                </div>
                {isNewBest && <p className="newbest">New best!</p>}
                <div className="row">
                  <button
                    className="primary"
                    onClick={restart}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      restart(e);
                    }}
                  >
                    Fly again <span className="desktop-hint"><kbd>R</kbd></span>
                  </button>
                </div>
                <p className="sub desktop-hint">or press Space</p>
                <p className="sub mobile-hint">or tap anywhere to fly</p>
              </div>
            </div>
          )}

          {(phase === 'playing' || phase === 'dead') && (
            <div className="live-hud" aria-hidden="true">
              <span className={phase === 'dead' ? 'crashed' : ''}>{phase === 'dead' ? 'Ouch' : `Best ${best}`}</span>
            </div>
          )}
        </div>

        <p className="controls-hint desktop-hint">
          <kbd>Space</kbd> / click / tap to flap &nbsp;·&nbsp; <kbd>R</kbd> to restart
        </p>
      </main>
    </div>
  );
}
