# Dinamo Web

An authentic retro arcade and Game Boy space shooter inspired by the 1981 classic **Galaga**, built with **TypeScript**, **PixiJS 7**, and **Vite**.

![Game Boy](https://img.shields.io/badge/Game%20Boy-160x144-88c070)
![Arcade](https://img.shields.io/badge/Arcade-Galaga%201981-red)
![PixiJS](https://img.shields.io/badge/PixiJS-7.x-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-4.x-purple)

---

## Direction & Roadmap

> Decoupled from [`dinamo`](https://github.com/williamlagos/dinamo) to serve as an independent **Web Multiplayer & Live `elements-server` Arcade Showcase**:
> - **Real-Time Multiplayer & Leaderboards:** Expand [`src/leaderboard.ts`](src/leaderboard.ts) and WebSocket sync with [`elements-server`](https://github.com/williamlagos/elements-server) for live co-op/versus sessions and global high-score boards.
> - **Browser-Native Sandbox:** Break out of 160×144 hardware limits to experiment with widescreen WebGL2 shaders, custom wave editors, and instant browser sharing.
> - **Standalone Baseline:** Built on the current PixiJS 7 + Web Audio API 160×144 shooter engine below.

---

## Overview

The current baseline brings a 160×144 retro arcade & Game Boy look and feel directly to modern browsers:
- **Unified 160×144 Game Boy Viewport:** Exact 10:9 aspect ratio integer-scaled with nearest-neighbor interpolation (`image-rendering: pixelated;`). Clean, centered display without faux plastic bezels.
- **Multiple Authentic 4-Color Palettes:**
  - **DMG (1989):** Classic pea-green dot-matrix LCD shades (`#e0f8d0`, `#88c070`, `#346856`, `#081820`).
  - **POCKET (1996):** Film-compensated true monochrome FSTN LCD (`#ffffff`, `#aaaaaa`, `#555555`, `#000000`).
  - **GBC (1998):** Colorized sprite banks with deep space background.
  - **ARCADE (1981):** Original full-color Galaga arcade aesthetics.
- **Procedural Pixel Art & Palettes:** Canvas-generated nearest-neighbor pixel textures paired with bundled palette definitions.
- **Authentic 8-Bit Chiptune Sound:** Real-time Web Audio API synthesis simulating the Game Boy Sound Controller:
  - Channel 1 & 2 pulse waves with frequency sweep (laser chirps, dive sirens, intro arpeggios).
  - Channel 4 7-bit & 15-bit LFSR pseudo-random noise generator with stepped volume decay for metallic crashes and explosions.
- **Tactical Galaga Armada:**
  - 10-ship armada (Boss Drones, Red Escorts, Blue Vanguard Bees) matching the GB Studio project.
  - Formation swaying (breathing), synchronized wing flaps, and aggressive dive-bomb sweeps.
  - Authentic 2-missile on-screen limitation.
- **Responsive Controls:** Desktop keyboard shortcuts and clean on-screen touch buttons for mobile devices.

---

## Controls

| Action | Desktop / Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Left / Right** | `←` / `→` or `A` / `D` | On-screen `◀` / `▶` buttons |
| **Fire Laser** | `Spacebar` / `Enter` / `↑` / `W` | On-screen `A / FIRE` button |
| **Switch Palette** | Keys `1` (DMG), `2` (Pocket), `3` (GBC), `4` (Arcade) | Top bar theme buttons |
| **Toggle Audio** | Click the `🔊` button | Tap the `🔊` button |
| **Restart Game** | Press `Spacebar` / `Enter` on Game Over | Tap `FIRE` button on Game Over |

---

## Tech Stack

- **Renderer:** [PixiJS 7](https://pixijs.com/) (WebGL2 / WebGL)
- **Language:** TypeScript 5
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)
- **Audio:** Web Audio API (procedural pulse waves & LFSR pseudo-random noise)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. Build for production:
   ```bash
   npm run build
   ```
   The optimized production bundle will be generated in `dist/`.

4. Preview production build:
   ```bash
   npm run preview
   ```
