import './style.css'
import * as PIXI from 'pixi.js'
import { generateTextures, ThemeType } from './textures'
import { GalagaGame } from './game'
import { sound } from './audio'

const GAME_WIDTH = 160
const GAME_HEIGHT = 144

// Read initial theme preference from URL or localStorage
const urlParams = new URLSearchParams(window.location.search)
const initialTheme = (urlParams.get('theme') as ThemeType) ||
  (localStorage.getItem('dinamo_theme') as ThemeType) ||
  'dmg'

// Set up UI layout in HTML - clean, centered, no bezel
const appContainer = document.querySelector<HTMLDivElement>('#app')!
appContainer.innerHTML = `
  <div class="dinamo-display-container">
    <header class="dinamo-header">
      <div class="title-group">
        <span class="game-logo">DINAMO</span>
        <span class="badge">GB</span>
      </div>
      <div class="theme-selector">
        <button class="theme-btn ${initialTheme === 'dmg' ? 'active' : ''}" data-theme="dmg" title="Game Boy DMG (1989)">DMG</button>
        <button class="theme-btn ${initialTheme === 'pocket' ? 'active' : ''}" data-theme="pocket" title="Game Boy Pocket (1996)">POCKET</button>
        <button class="theme-btn ${initialTheme === 'gbc' ? 'active' : ''}" data-theme="gbc" title="Game Boy Color (1998)">GBC</button>
        <button class="theme-btn ${initialTheme === 'arcade' ? 'active' : ''}" data-theme="arcade" title="Arcade 1981">ARCADE</button>
      </div>
      <button id="btn-sound" class="icon-btn" aria-label="Toggle Sound" title="Toggle Sound">🔊</button>
    </header>

    <main class="canvas-viewport" id="canvas-container">
      <!-- Pixi Canvas will be mounted here -->
    </main>

    <footer class="dinamo-footer">
      <div class="touch-controls">
        <div class="dpad-buttons">
          <button id="btn-left" class="touch-btn" aria-label="Move Left">◀</button>
          <button id="btn-right" class="touch-btn" aria-label="Move Right">▶</button>
        </div>
        <div class="action-buttons">
          <button id="btn-fire" class="touch-btn fire-btn" aria-label="Fire Laser">A / FIRE</button>
        </div>
      </div>
      <div class="keyboard-legend">
        <span><strong>← → / A D</strong> Move &bull; <strong>SPACE / ENTER</strong> Fire &bull; <strong>1-4</strong> Palettes</span>
      </div>
    </footer>
  </div>
`

// Create PIXI Application with crisp 160x144 Game Boy resolution
const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x081820,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
  antialias: false,
})

const canvasWrapper = document.getElementById('canvas-container')!
canvasWrapper.appendChild(app.view as unknown as HTMLCanvasElement)

// Generate textures & init game
const textures = generateTextures(initialTheme, 1)
const game = new GalagaGame(app, textures, initialTheme)

// Add Game loop to ticker
app.ticker.add((delta) => {
  game.update(delta)
})

// --- Theme Switcher Logic ---
function switchTheme(newTheme: ThemeType) {
  game.setTheme(newTheme)
  localStorage.setItem('dinamo_theme', newTheme)

  // Update theme container class for styling accents
  document.body.setAttribute('data-theme', newTheme)

  // Update UI active buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === newTheme)
  })
}

// Initial body theme attribute
document.body.setAttribute('data-theme', initialTheme)

document.querySelectorAll<HTMLButtonElement>('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme') as ThemeType
    if (theme) switchTheme(theme)
  })
})

// --- Keyboard Controls ---
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'KeyA', 'a'].includes(e.code) || ['ArrowLeft', 'KeyA', 'a'].includes(e.key)) {
    game.input.left = true
  }
  if (['ArrowRight', 'KeyD', 'd'].includes(e.code) || ['ArrowRight', 'KeyD', 'd'].includes(e.key)) {
    game.input.right = true
  }
  if (['Space', 'Enter', 'ArrowUp', 'KeyW'].includes(e.code) || ['Space', 'Enter', 'ArrowUp', 'KeyW'].includes(e.key)) {
    game.input.fire = true
  }

  // Quick theme switches via number keys
  if (e.key === '1') switchTheme('dmg')
  if (e.key === '2') switchTheme('pocket')
  if (e.key === '3') switchTheme('gbc')
  if (e.key === '4') switchTheme('arcade')
})

window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'KeyA', 'a'].includes(e.code) || ['ArrowLeft', 'KeyA', 'a'].includes(e.key)) {
    game.input.left = false
  }
  if (['ArrowRight', 'KeyD', 'd'].includes(e.code) || ['ArrowRight', 'KeyD', 'd'].includes(e.key)) {
    game.input.right = false
  }
  if (['Space', 'Enter', 'ArrowUp', 'KeyW'].includes(e.code) || ['Space', 'Enter', 'ArrowUp', 'KeyW'].includes(e.key)) {
    game.input.fire = false
  }
})

// --- On-Screen / Touch Controls ---
const btnLeft = document.getElementById('btn-left')!
const btnRight = document.getElementById('btn-right')!
const btnFire = document.getElementById('btn-fire')!
const btnSound = document.getElementById('btn-sound')!

const bindTouchOrMouse = (el: HTMLElement, onDown: () => void, onUp: () => void) => {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    onDown()
  })
  el.addEventListener('pointerup', (e) => {
    e.preventDefault()
    onUp()
  })
  el.addEventListener('pointercancel', (e) => {
    e.preventDefault()
    onUp()
  })
  el.addEventListener('pointerleave', (e) => {
    e.preventDefault()
    onUp()
  })
}

bindTouchOrMouse(
  btnLeft,
  () => { game.input.left = true },
  () => { game.input.left = false }
)

bindTouchOrMouse(
  btnRight,
  () => { game.input.right = true },
  () => { game.input.right = false }
)

bindTouchOrMouse(
  btnFire,
  () => { game.input.fire = true },
  () => { game.input.fire = false }
)

btnSound.addEventListener('click', () => {
  sound.enabled = !sound.enabled
  btnSound.textContent = sound.enabled ? '🔊' : '🔇'
})
