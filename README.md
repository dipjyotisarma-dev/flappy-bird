# Flappy Dusk 🌅

A responsive arcade flight game built with React, TypeScript, and HTML5 Canvas. Lightweight, fast, and optimized for both desktop and mobile play.

![Flappy Dusk Icon](public/favicon.svg)

---

## Features

- **Mobile & Desktop Ready:** 
  - **Desktop:** Press <kbd>Space</kbd>, <kbd>W</kbd>, or <kbd>↑</kbd> to flap; press <kbd>R</kbd> to restart.
  - **Mobile:** Tap anywhere on the screen to flap or restart.
- **Responsive Viewport:** Scales dynamically to fit phones, tablets, and desktop displays, honoring safe-area insets (notches, Dynamic Island, and home bars).
- **Zero Asset Overhead:** Procedural sound synthesis using the Web Audio API and procedural particle effects (no sprite sheets or audio files to download).
- **Mobile Polish:** Touch-optimized controls, subtle haptic vibration feedback, and PWA standalone support.
- **Score Persistence:** Saves your all-time best score in `localStorage`.

---

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript 5.5
- **Bundler:** Vite 6
- **Graphics & Audio:** HTML5 Canvas (2D Context) + Web Audio API

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd flappy-bird

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check & Production Build

```bash
# Type check without emitting files
npm run check

# Create production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment to Vercel

This project is configured for zero-config deployment on [Vercel](https://vercel.com):

### Option 1: Via Vercel CLI
```bash
npx vercel
```

### Option 2: Via Git
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the project into the Vercel dashboard.
3. Vercel automatically detects **Vite**, sets the output directory to `dist`, and builds via `npm run build`.

---

## License

MIT
