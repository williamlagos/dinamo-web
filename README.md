# Dinamo Web

An authentic 80s arcade space shooter inspired by the 1981 classic **Galaga**, built with **TypeScript**, **PixiJS 7**, and **Vite**.

![Arcade](https://img.shields.io/badge/Arcade-Galaga%201981-red)
![PixiJS](https://img.shields.io/badge/PixiJS-7.x-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-4.x-purple)

---

## Overview

Dinamo Web recreates the quintessential retro arcade experience directly in the browser:
- **Arcade Cabinet Presentation:** Retro CRT scanline effect, neon arcade bezel, and responsive arcade cabinet styling.
- **Parallax Starfield:** Multi-layered background stars drifting downward at variable speeds with color-twinkling effects.
- **Bézier Curved Swarm Entrances:** Enemies enter in choreographed loops, S-curves, and swoops before assembling into the fleet formation.
- **Breathing Formation & Wing Flapping:** The alien armada sways horizontally across the screen with synchronized 2-frame wing animations.
- **Dive-Bombing Attacks:** Enemies peel off the formation, swoop aggressively towards the player's position, drop bullets midway through the dive, and loop around to rejoin the fleet.
- **Authentic Combat Rules:** True to Galaga, the player is limited to a maximum of **2 twin missiles on screen at once**, rewarding accuracy.
- **Procedural Pixel Art & Web Audio Synth:** 100% self-contained with zero external image or audio file dependencies. Crisp pixel art is generated via canvas matrices and 8-bit sound effects (lasers, sirens, explosions, stage fanfare) are synthesized in real time via the Web Audio API.
- **Arcade HUD:** Live `1UP` score, persistent `HIGH SCORE` (stored in `localStorage`), `STAGE` badges, and mini-fighter icons for remaining lives.

---

## Controls

| Action | Desktop / Keyboard | Mobile / Touch |
| :--- | :--- | :--- |
| **Move Left / Right** | `←` / `→` or `A` / `D` | On-screen `◀` / `▶` D-Pad buttons |
| **Fire Laser** | `Spacebar` / `Enter` / `↑` / `W` | On-screen `FIRE` arcade button |
| **Toggle Audio** | Click the `🔊` button | Tap the `🔊` button |
| **Restart Game** | Press `Spacebar` / `Enter` on Game Over | Tap `FIRE` button on Game Over |

---

## Tech Stack

- **Renderer:** [PixiJS 7](https://pixijs.com/) (WebGL2 / WebGL)
- **Language:** TypeScript 5
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/)
- **Audio:** Web Audio API (procedural square/sawtooth waves & white noise bursts)

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
