# Implementation Plan: Mobile Playability & Vercel Deployment Readiness

## Objective
Make "Flappy Dusk" fully responsive and playable on mobile devices (tap to play/flap/restart) and desktop (Space/keys to play/restart) without changing game logic, without adding new components, and without introducing new external tools or frameworks. Ensure the project is 100% deployment ready for Vercel.

## Task Backlog

- [x] Task 1: Environment & Deployment Hygiene
  - [x] 1.1 Create `.gitignore` to protect `node_modules`, `dist`, local logs, and cache.
  - [x] 1.2 Initialize local git repository (`git init`).
  - [x] 1.3 Create `public/` directory with clean `favicon.svg` and `favicon.ico` to prevent 404s on Vercel.
  - [x] 1.4 Enhance `index.html` with mobile meta tags (PWA tags, Apple mobile web app capable, theme color, icons, OpenGraph tags).

- [x] Task 2: Mobile Touch Interaction & Controls
  - [x] 2.1 Enable "Tap anywhere on screen" in `App.tsx` on the `.overlay` during `ready` and `gameover` phases.
  - [x] 2.2 Retain full desktop controls: Space, ArrowUp, W to flap/start, R to restart.
  - [x] 2.3 Prevent event bubbling collision between button clicks and overlay taps (`e.stopPropagation()`).
  - [x] 2.4 Optimize `onPointerDown` handling in `GameCanvas.tsx` for mobile touch responsiveness.

- [x] Task 3: Mobile WebAudio Unlock & Robustness
  - [x] 3.1 Update `src/game/audio.ts` to handle both `'suspended'` and `'interrupted'` states on iOS Safari / WebKit.
  - [x] 3.2 Add user-gesture audio context resume trigger so audio plays reliably without being blocked by mobile autoplay policies.

- [x] Task 4: Responsive CSS & Mobile Viewport Hardening
  - [x] 4.1 Implement safe area insets (`env(safe-area-inset-*)`) on `.topbar` and `.controls-hint` for notch / dynamic island / home indicator.
  - [x] 4.2 Prevent mobile browser quirks: `-webkit-tap-highlight-color: transparent`, `-webkit-touch-callout: none`, `touch-action: none`, `user-select: none`.
  - [x] 4.3 Add responsive styling for mobile touch screens (`@media (hover: none) and (pointer: coarse)`) to hide/adapt desktop `<kbd>` references.
  - [x] 4.4 Ensure panel fits comfortably on short landscape mobile viewports.

- [x] Task 5: Verification & Quality Assurance
  - [x] 5.1 Run `npm run check` (`tsc --noEmit`).
  - [x] 5.2 Run `npm run build` (`vite build`).
  - [x] 5.3 Run automated physics & viewport smoke test.
  - [x] 5.4 Conduct CodeRabbit-standard review of all diffs.
  - [x] 5.5 Commit working changes to git.
