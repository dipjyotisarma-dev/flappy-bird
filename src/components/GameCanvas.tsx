import { useEffect, useRef } from 'react';
import { FlappyEngine } from '../game/engine';
import type { GamePhase } from '../game/types';

interface Props {
  engineRef: React.MutableRefObject<FlappyEngine | null>;
  onPhase: (p: GamePhase) => void;
  onScore: (score: number, best: number) => void;
}

export default function GameCanvas({ engineRef, onPhase, onScore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef({ onPhase, onScore });
  cbRef.current = { onPhase, onScore };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new FlappyEngine(canvas, {
      onPhase: (p) => cbRef.current.onPhase(p),
      onScore: (s, b) => cbRef.current.onScore(s, b)
    });
    engineRef.current = engine;
    engine.start();

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault(); // Space must never scroll the page
        if (!e.repeat) engine.press();
      } else if (e.code === 'KeyR') {
        engine.restartRun();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      engine.destroy();
      engineRef.current = null;
    };
  }, [engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      tabIndex={0}
      aria-label="Flappy Dusk game canvas. Press Space to flap."
      onPointerDown={(e) => {
        e.preventDefault();
        engineRef.current?.press();
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
