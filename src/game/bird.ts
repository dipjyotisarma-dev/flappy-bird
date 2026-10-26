import { BIRD_R, BIRD_X, FLAP_VY, GRAVITY, MAX_FALL } from './constants';
import { DUSK } from './palette';

export class Bird {
  x = BIRD_X;
  y = 280;
  anchorY = 280;
  vy = 0;
  r = BIRD_R;
  wingT = 0;
  alive = true;

  reset(startY: number): void {
    this.y = startY;
    this.anchorY = startY;
    this.vy = 0;
    this.wingT = 0;
    this.alive = true;
  }

  flap(): void {
    this.vy = FLAP_VY;
  }

  /** Fixed-step friendly physics update. dt in seconds. */
  update(dt: number, playing: boolean, idleT: number): void {
    this.wingT += dt * (playing ? 14 : 6);
    if (!playing) {
      // Gentle bob on the ready screen.
      this.y = this.anchorY + Math.sin(idleT * 2.4) * 8;
      this.vy = 0;
      return;
    }
    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
    this.y += this.vy * dt;
  }

  get rotation(): number {
    // Tilt up on flap, dive when falling. Clamped for game feel.
    if (this.vy < 0) return Math.max(-0.42, this.vy / 1400);
    return Math.min(1.35, this.vy / 700);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y, r } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.rotation);

    // Tail
    ctx.fillStyle = DUSK.birdWingDark;
    ctx.beginPath();
    ctx.moveTo(-r - 2, -1);
    ctx.lineTo(-r - 9, -5);
    ctx.lineTo(-r - 8, 3);
    ctx.closePath();
    ctx.fill();

    // Body
    const body = ctx.createLinearGradient(0, -r, 0, r);
    body.addColorStop(0, DUSK.birdBody);
    body.addColorStop(1, DUSK.birdBelly);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 2, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(27,20,64,0.55)';
    ctx.stroke();

    // Belly highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 6, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Wing — 2-frame flap via sin
    const flap = Math.sin(this.wingT);
    const wingY = -1 + flap * 3.5;
    const wingH = 7 - Math.abs(flap) * 2;
    ctx.fillStyle = DUSK.birdWing;
    ctx.beginPath();
    ctx.ellipse(-3, wingY, 9, Math.max(3, wingH), -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(27,20,64,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye
    ctx.fillStyle = DUSK.birdEye;
    ctx.beginPath();
    ctx.arc(6, -5, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DUSK.birdPupil;
    ctx.beginPath();
    ctx.arc(7.5, -5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8.2, -5.8, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = DUSK.birdBeak;
    ctx.beginPath();
    ctx.moveTo(r + 1, -1);
    ctx.lineTo(r + 9, 1.5);
    ctx.lineTo(r + 1, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(27,20,64,0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }
}
