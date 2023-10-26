import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
import * as PIXI from 'pixi.js'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript + PIXI</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

// Create the application helper and add its render target to the page
let app = new PIXI.Application({ width: 640, height: 360 })
document.querySelector<HTMLDivElement>('#app')!.appendChild(app.view)

// Create the sprite and add it to the stage
let sprite = PIXI.Sprite.from(typescriptLogo)
app.stage.addChild(sprite)

// Add a ticker callback to move the sprite back and forth
let elapsed = 0.0
app.ticker.add((delta: number) => {
  elapsed += delta
  sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
})

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
