import './style.css'
import * as PIXI from 'pixi.js'
import { generateTextures } from './textures'
import { GalagaGame } from './game'
import { sound } from './audio'

const GAME_WIDTH = 448
const GAME_HEIGHT = 640

// Set up UI layout in HTML
const appContainer = document.querySelector<HTMLDivElement>('#app')!
appContainer.innerHTML = `
  <div class="arcade-cabinet">
    <div class="arcade-bezel">
      <div class="cabinet-marquee">DINAMO - GALAGA 1981</div>
      <div class="canvas-wrapper" id="canvas-container">
        <!-- Pixi Canvas will be mounted here -->
        <div class="crt-scanlines"></div>
      </div>
      <div class="arcade-controls">
        <div class="dpad-buttons">
          <button id="btn-left" class="arcade-btn dpad" aria-label="Move Left">◀</button>
          <button id="btn-right" class="arcade-btn dpad" aria-label="Move Right">▶</button>
        </div>
        <div class="action-buttons">
          <button id="btn-fire" class="arcade-btn fire-btn" aria-label="Fire Laser">FIRE</button>
          <button id="btn-sound" class="arcade-btn sound-btn" aria-label="Toggle Sound">🔊</button>
        </div>
      </div>
      <div class="keyboard-legend">
        <span>Controls: <strong>← → / A D</strong> to Move &bull; <strong>SPACE / ENTER</strong> to Fire</span>
      </div>
    </div>
  </div>
`

// Create PIXI Application with pixel-art rendering options
const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x05050d,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
  autoDensity: true,
  antialias: false,
})

const canvasWrapper = document.getElementById('canvas-container')!
canvasWrapper.appendChild(app.view as unknown as HTMLCanvasElement)

// Generate textures & init game
const textures = generateTextures()
const game = new GalagaGame(app, textures)

// Add Game loop to ticker
app.ticker.add((delta) => {
  game.update(delta)
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
