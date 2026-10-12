import * as PIXI from 'pixi.js'
import { GameTextures } from './textures'
import { sound } from './audio'
import { Point, getEntrancePath, getDivePath } from './paths'

export type EnemyType = 'bee' | 'butterfly' | 'boss'
export type EnemyState = 'entering' | 'formation' | 'diving' | 'returning'

interface Enemy {
  sprite: PIXI.Sprite
  type: EnemyType
  row: number
  col: number
  targetSlot: Point
  state: EnemyState
  health: number
  path: Point[]
  pathIndex: number
  frameTimer: number
  currentFrame: number
  hasFired: boolean
}

interface Bullet {
  sprite: PIXI.Sprite
  vx: number
  vy: number
  isPlayer: boolean
}

interface Explosion {
  sprite: PIXI.Sprite
  frameIndex: number
  timer: number
}

interface Star {
  gfx: PIXI.Graphics
  speed: number
  twinkleTimer: number
}

export class GalagaGame {
  public app: PIXI.Application
  public textures: GameTextures
  public width = 448
  public height = 640

  // Display Containers
  private starContainer = new PIXI.Container()
  private gameContainer = new PIXI.Container()
  private hudContainer = new PIXI.Container()
  private overlayContainer = new PIXI.Container()

  // Game Objects
  private stars: Star[] = []
  private player!: PIXI.Sprite
  private enemies: Enemy[] = []
  private bullets: Bullet[] = []
  private explosions: Explosion[] = []
  private lifeIcons: PIXI.Sprite[] = []

  // Game State
  public score = 0
  public highScore = 20000
  public lives = 3
  public stage = 1
  public isGameOver = false
  public isStageIntro = false
  public isPlayerDead = false
  private respawnTimer = 0
  private invulnerableTimer = 0

  // Controls state
  public input = {
    left: false,
    right: false,
    fire: false,
  }
  private fireCooldown = 0

  // Formation & Swarm Timers
  private formationTime = 0
  private diveTimer = 0
  private waveQueue: {
    type: EnemyType
    row: number
    col: number
    pathType: 'topLeft' | 'topRight' | 'leftSide' | 'rightSide'
    delay: number
  }[] = []
  private spawnTimer = 0

  // HUD Text Elements
  private scoreText!: PIXI.Text
  private highScoreText!: PIXI.Text
  private stageText!: PIXI.Text
  private messageText!: PIXI.Text

  constructor(app: PIXI.Application, textures: GameTextures) {
    this.app = app
    this.textures = textures

    // Load High Score
    const saved = localStorage.getItem('dinamo_galaga_high_score')
    if (saved) {
      this.highScore = parseInt(saved, 10) || 20000
    }

    this.setupContainers()
    this.setupStarfield()
    this.setupHUD()
    this.setupPlayer()
    this.startNewGame()
  }

  private setupContainers() {
    this.app.stage.addChild(this.starContainer)
    this.app.stage.addChild(this.gameContainer)
    this.app.stage.addChild(this.hudContainer)
    this.app.stage.addChild(this.overlayContainer)
  }

  private setupStarfield() {
    const starColors = [0xffffff, 0x88ccff, 0xffe066, 0xff6666]
    for (let i = 0; i < 90; i++) {
      const gfx = new PIXI.Graphics()
      const color = starColors[Math.floor(Math.random() * starColors.length)]
      const size = Math.random() > 0.85 ? 2.5 : 1.5
      gfx.beginFill(color)
      gfx.drawRect(0, 0, size, size)
      gfx.endFill()

      gfx.x = Math.random() * this.width
      gfx.y = Math.random() * this.height

      const speed = 0.5 + Math.random() * 2.2
      this.stars.push({
        gfx,
        speed,
        twinkleTimer: Math.random() * 60,
      })
      this.starContainer.addChild(gfx)
    }
  }

  private setupHUD() {
    const fontStyle = new PIXI.TextStyle({
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: ['#ffffff'],
      letterSpacing: 2,
    })

    const redStyle = new PIXI.TextStyle({
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 14,
      fontWeight: 'bold',
      fill: ['#ff3333'],
      letterSpacing: 2,
    })

    const title1UP = new PIXI.Text('1UP', redStyle)
    title1UP.position.set(30, 8)
    this.hudContainer.addChild(title1UP)

    this.scoreText = new PIXI.Text('00', fontStyle)
    this.scoreText.position.set(30, 26)
    this.hudContainer.addChild(this.scoreText)

    const titleHigh = new PIXI.Text('HIGH SCORE', redStyle)
    titleHigh.position.set(this.width / 2 - 50, 8)
    this.hudContainer.addChild(titleHigh)

    this.highScoreText = new PIXI.Text(`${this.highScore}`, fontStyle)
    this.highScoreText.position.set(this.width / 2 - 30, 26)
    this.hudContainer.addChild(this.highScoreText)

    this.stageText = new PIXI.Text(`STAGE 1`, redStyle)
    this.stageText.position.set(this.width - 100, 26)
    this.hudContainer.addChild(this.stageText)

    this.messageText = new PIXI.Text('', new PIXI.TextStyle({
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 22,
      fontWeight: 'bold',
      fill: ['#ffff00'],
      align: 'center',
      dropShadow: true,
      dropShadowColor: '#ff0000',
      dropShadowDistance: 2,
    }))
    this.messageText.anchor.set(0.5)
    this.messageText.position.set(this.width / 2, this.height / 2)
    this.overlayContainer.addChild(this.messageText)

    this.updateLifeIcons()
  }

  private updateLifeIcons() {
    this.lifeIcons.forEach(icon => icon.destroy())
    this.lifeIcons = []
    for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
      const icon = new PIXI.Sprite(this.textures.playerMini)
      icon.anchor.set(0.5)
      icon.position.set(25 + i * 20, this.height - 18)
      this.hudContainer.addChild(icon)
      this.lifeIcons.push(icon)
    }
  }

  private setupPlayer() {
    this.player = new PIXI.Sprite(this.textures.player)
    this.player.anchor.set(0.5)
    this.player.position.set(this.width / 2, this.height - 50)
    this.gameContainer.addChild(this.player)
  }

  public startNewGame() {
    this.score = 0
    this.lives = 3
    this.stage = 1
    this.isGameOver = false
    this.isPlayerDead = false
    this.clearEnemiesAndBullets()
    this.updateLifeIcons()
    this.player.visible = true
    this.player.position.set(this.width / 2, this.height - 50)
    this.startStage(this.stage)
  }

  private clearEnemiesAndBullets() {
    this.enemies.forEach(e => e.sprite.destroy())
    this.enemies = []
    this.bullets.forEach(b => b.sprite.destroy())
    this.bullets = []
    this.explosions.forEach(exp => exp.sprite.destroy())
    this.explosions = []
  }

  private startStage(stageNumber: number) {
    this.stage = stageNumber
    this.stageText.text = `STAGE ${stageNumber}`
    this.isStageIntro = true
    this.messageText.text = `STAGE ${stageNumber}\nREADY`
    this.messageText.visible = true

    sound.playStageStart()

    // Build the grid formation wave plan
    this.buildWaveQueue()

    setTimeout(() => {
      this.isStageIntro = false
      this.messageText.visible = false
    }, 2200)
  }

  // Pre-calculate target grid positions for a 4x10 fleet
  private getFormationSlot(row: number, col: number): Point {
    const gridStartX = 60
    const gridStartY = 90
    const colSpacing = 36
    const rowSpacing = 28
    return {
      x: gridStartX + col * colSpacing,
      y: gridStartY + row * rowSpacing,
    }
  }

  private buildWaveQueue() {
    this.waveQueue = []

    // 4 Bosses in Row 0 (cols 3, 4, 5, 6)
    // 8 Butterflies in Row 1 (cols 1 through 8)
    // 8 Bees in Row 2 (cols 1 through 8)
    // 10 Bees in Row 3 (cols 0 through 9)

    // Wave 1: 4 Bosses + 4 Butterflies via topLeft & topRight
    const wave1 = [
      { type: 'boss' as EnemyType, row: 0, col: 4, pathType: 'topLeft' as const },
      { type: 'boss' as EnemyType, row: 0, col: 5, pathType: 'topRight' as const },
      { type: 'boss' as EnemyType, row: 0, col: 3, pathType: 'topLeft' as const },
      { type: 'boss' as EnemyType, row: 0, col: 6, pathType: 'topRight' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 4, pathType: 'topLeft' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 5, pathType: 'topRight' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 3, pathType: 'topLeft' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 6, pathType: 'topRight' as const },
    ]

    // Wave 2: 4 Butterflies + 4 Bees via leftSide & rightSide
    const wave2 = [
      { type: 'butterfly' as EnemyType, row: 1, col: 1, pathType: 'leftSide' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 8, pathType: 'rightSide' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 2, pathType: 'leftSide' as const },
      { type: 'butterfly' as EnemyType, row: 1, col: 7, pathType: 'rightSide' as const },
      { type: 'bee' as EnemyType, row: 2, col: 4, pathType: 'leftSide' as const },
      { type: 'bee' as EnemyType, row: 2, col: 5, pathType: 'rightSide' as const },
      { type: 'bee' as EnemyType, row: 2, col: 3, pathType: 'leftSide' as const },
      { type: 'bee' as EnemyType, row: 2, col: 6, pathType: 'rightSide' as const },
    ]

    // Wave 3: 4 Bees row 2 + 4 Bees row 3 via topLeft & topRight
    const wave3 = [
      { type: 'bee' as EnemyType, row: 2, col: 1, pathType: 'topLeft' as const },
      { type: 'bee' as EnemyType, row: 2, col: 8, pathType: 'topRight' as const },
      { type: 'bee' as EnemyType, row: 2, col: 2, pathType: 'topLeft' as const },
      { type: 'bee' as EnemyType, row: 2, col: 7, pathType: 'topRight' as const },
      { type: 'bee' as EnemyType, row: 3, col: 4, pathType: 'topLeft' as const },
      { type: 'bee' as EnemyType, row: 3, col: 5, pathType: 'topRight' as const },
      { type: 'bee' as EnemyType, row: 3, col: 3, pathType: 'topLeft' as const },
      { type: 'bee' as EnemyType, row: 3, col: 6, pathType: 'topRight' as const },
    ]

    // Wave 4: remaining 6 Bees row 3 via leftSide & rightSide
    const wave4 = [
      { type: 'bee' as EnemyType, row: 3, col: 0, pathType: 'leftSide' as const },
      { type: 'bee' as EnemyType, row: 3, col: 9, pathType: 'rightSide' as const },
      { type: 'bee' as EnemyType, row: 3, col: 1, pathType: 'leftSide' as const },
      { type: 'bee' as EnemyType, row: 3, col: 8, pathType: 'rightSide' as const },
      { type: 'bee' as EnemyType, row: 3, col: 2, pathType: 'leftSide' as const },
      { type: 'bee' as EnemyType, row: 3, col: 7, pathType: 'rightSide' as const },
    ]

    const allWaves = [...wave1, ...wave2, ...wave3, ...wave4]
    allWaves.forEach((w, i) => {
      this.waveQueue.push({
        ...w,
        delay: 8 + i * 14,
      })
    })
  }

  private spawnEnemy(item: (typeof this.waveQueue)[0]) {
    const slot = this.getFormationSlot(item.row, item.col)
    const path = getEntrancePath(item.pathType, slot)
    const initialPos = path[0] || { x: 0, y: 0 }

    let texture = this.textures.bee1
    let health = 1
    if (item.type === 'butterfly') {
      texture = this.textures.butterfly1
    } else if (item.type === 'boss') {
      texture = this.textures.bossGreen1
      health = 2
    }

    const sprite = new PIXI.Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.position.set(initialPos.x, initialPos.y)
    this.gameContainer.addChild(sprite)

    this.enemies.push({
      sprite,
      type: item.type,
      row: item.row,
      col: item.col,
      targetSlot: slot,
      state: 'entering',
      health,
      path,
      pathIndex: 0,
      frameTimer: 0,
      currentFrame: 1,
      hasFired: false,
    })
  }

  // --- CORE GAME LOOP UPDATE ---
  public update(delta: number) {
    this.updateStars(delta)

    if (this.isGameOver) {
      if (this.input.fire) {
        this.startNewGame()
      }
      return
    }

    if (this.isStageIntro) {
      return
    }

    this.updatePlayer(delta)
    this.updateSwarmEntrance(delta)
    this.updateFormation(delta)
    this.updateDiveBombers(delta)
    this.updateBullets(delta)
    this.updateExplosions(delta)
    this.checkCollisions()
    this.checkWaveProgress()
  }

  private updateStars(delta: number) {
    for (const star of this.stars) {
      star.gfx.y += star.speed * delta
      if (star.gfx.y > this.height) {
        star.gfx.y = 0
        star.gfx.x = Math.random() * this.width
      }
      star.twinkleTimer += delta
      if (star.twinkleTimer > 40) {
        star.gfx.alpha = Math.random() > 0.4 ? 1.0 : 0.4
        star.twinkleTimer = 0
      }
    }
  }

  private updatePlayer(delta: number) {
    if (this.isPlayerDead) {
      this.respawnTimer -= delta
      if (this.respawnTimer <= 0) {
        if (this.lives > 0) {
          this.isPlayerDead = false
          this.player.visible = true
          this.player.position.set(this.width / 2, this.height - 50)
          this.invulnerableTimer = 120 // 2 seconds invulnerability
        } else {
          this.gameOver()
        }
      }
      return
    }

    // Invulnerability blinking
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta
      this.player.alpha = Math.floor(this.invulnerableTimer / 8) % 2 === 0 ? 0.4 : 1.0
    } else {
      this.player.alpha = 1.0
    }

    // Player Movement
    const speed = 4.2 * delta
    if (this.input.left) {
      this.player.x -= speed
    }
    if (this.input.right) {
      this.player.x += speed
    }
    this.player.x = Math.max(24, Math.min(this.width - 24, this.player.x))

    // Player Firing (Authentic Galaga rule: maximum 2 missiles on screen at once!)
    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta
    }

    const playerMissiles = this.bullets.filter(b => b.isPlayer)
    if (this.input.fire && this.fireCooldown <= 0 && playerMissiles.length < 2) {
      this.firePlayerMissile()
      this.fireCooldown = 14 // Rate limit
    }
  }

  private firePlayerMissile() {
    sound.playLaser()
    const sprite = new PIXI.Sprite(this.textures.playerLaser)
    sprite.anchor.set(0.5)
    sprite.position.set(this.player.x, this.player.y - 16)
    this.gameContainer.addChild(sprite)

    this.bullets.push({
      sprite,
      vx: 0,
      vy: -10.5,
      isPlayer: true,
    })
  }

  private updateSwarmEntrance(delta: number) {
    if (this.waveQueue.length > 0) {
      this.spawnTimer += delta
      const next = this.waveQueue[0]
      if (this.spawnTimer >= next.delay) {
        this.spawnTimer = 0
        this.waveQueue.shift()
        this.spawnEnemy(next)
      }
    }
  }

  private updateFormation(delta: number) {
    this.formationTime += delta * 0.045
    const swayX = Math.sin(this.formationTime) * 16

    for (const enemy of this.enemies) {
      // Flapping wing animation
      enemy.frameTimer += delta
      if (enemy.frameTimer >= 22) {
        enemy.frameTimer = 0
        enemy.currentFrame = enemy.currentFrame === 1 ? 2 : 1
        this.updateEnemyTexture(enemy)
      }

      if (enemy.state === 'entering') {
        enemy.pathIndex += 1.8 * delta
        const idx = Math.floor(enemy.pathIndex)
        if (idx < enemy.path.length) {
          const pt = enemy.path[idx]
          enemy.sprite.position.set(pt.x, pt.y)
        } else {
          enemy.state = 'formation'
        }
      } else if (enemy.state === 'formation') {
        enemy.sprite.x = enemy.targetSlot.x + swayX
        enemy.sprite.y = enemy.targetSlot.y
        enemy.sprite.rotation = 0
      } else if (enemy.state === 'returning') {
        // Smooth return from top of screen into formation slot
        const destX = enemy.targetSlot.x + swayX
        const destY = enemy.targetSlot.y
        enemy.sprite.x += (destX - enemy.sprite.x) * 0.06 * delta
        enemy.sprite.y += (destY - enemy.sprite.y) * 0.06 * delta

        if (Math.hypot(destX - enemy.sprite.x, destY - enemy.sprite.y) < 5) {
          enemy.state = 'formation'
          enemy.hasFired = false
        }
      }
    }
  }

  private updateEnemyTexture(enemy: Enemy) {
    if (enemy.type === 'bee') {
      enemy.sprite.texture = enemy.currentFrame === 1 ? this.textures.bee1 : this.textures.bee2
    } else if (enemy.type === 'butterfly') {
      enemy.sprite.texture = enemy.currentFrame === 1 ? this.textures.butterfly1 : this.textures.butterfly2
    } else if (enemy.type === 'boss') {
      if (enemy.health > 1) {
        enemy.sprite.texture = enemy.currentFrame === 1 ? this.textures.bossGreen1 : this.textures.bossGreen2
      } else {
        enemy.sprite.texture = enemy.currentFrame === 1 ? this.textures.bossBlue1 : this.textures.bossBlue2
      }
    }
  }

  private updateDiveBombers(delta: number) {
    // Only launch dive bombers when no more enemies are queued to spawn
    if (this.waveQueue.length > 0) return

    this.diveTimer += delta
    const diveInterval = Math.max(60, 140 - this.stage * 15) // Faster in higher stages

    if (this.diveTimer >= diveInterval) {
      this.diveTimer = 0
      const formationEnemies = this.enemies.filter(e => e.state === 'formation')
      if (formationEnemies.length > 0) {
        // Pick 1 to 2 random enemies to dive
        const count = Math.min(formationEnemies.length, Math.random() > 0.6 ? 2 : 1)
        for (let i = 0; i < count; i++) {
          const victim = formationEnemies[Math.floor(Math.random() * formationEnemies.length)]
          this.launchDive(victim)
        }
      }
    }

    // Process diving enemies
    for (const enemy of this.enemies) {
      if (enemy.state === 'diving') {
        enemy.pathIndex += (1.9 + this.stage * 0.2) * delta
        const idx = Math.floor(enemy.pathIndex)

        if (idx < enemy.path.length) {
          const pt = enemy.path[idx]
          const nextPt = enemy.path[Math.min(enemy.path.length - 1, idx + 1)]
          enemy.sprite.position.set(pt.x, pt.y)

          // Rotate sprite along flight direction
          const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) - Math.PI / 2
          enemy.sprite.rotation = angle

          // Fire bullet midway through dive
          if (!enemy.hasFired && pt.y > this.height * 0.35 && pt.y < this.height * 0.7) {
            this.fireAlienBullet(enemy)
            enemy.hasFired = true
          }
        } else {
          // Off bottom of screen, loop back to top
          enemy.state = 'returning'
          enemy.sprite.x = enemy.targetSlot.x
          enemy.sprite.y = -30
          enemy.sprite.rotation = 0
        }
      }
    }
  }

  private launchDive(enemy: Enemy) {
    sound.playDive()
    enemy.state = 'diving'
    enemy.hasFired = false
    enemy.path = getDivePath(
      { x: enemy.sprite.x, y: enemy.sprite.y },
      this.player.x,
      this.width,
      this.height
    )
    enemy.pathIndex = 0
  }

  private fireAlienBullet(enemy: Enemy) {
    const sprite = new PIXI.Sprite(this.textures.alienBullet)
    sprite.anchor.set(0.5)
    sprite.position.set(enemy.sprite.x, enemy.sprite.y + 10)
    this.gameContainer.addChild(sprite)

    // Aim toward player
    const dx = this.player.x - enemy.sprite.x
    const dy = this.player.y - enemy.sprite.y
    const angle = Math.atan2(dy, dx)
    const speed = 4.0 + this.stage * 0.5

    this.bullets.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      isPlayer: false,
    })
  }

  private updateBullets(delta: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.sprite.x += b.vx * delta
      b.sprite.y += b.vy * delta

      // Out of bounds cleanup
      if (b.sprite.y < -20 || b.sprite.y > this.height + 20 || b.sprite.x < -20 || b.sprite.x > this.width + 20) {
        b.sprite.destroy()
        this.bullets.splice(i, 1)
      }
    }
  }

  private updateExplosions(delta: number) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i]
      exp.timer += delta
      if (exp.timer >= 5) {
        exp.timer = 0
        exp.frameIndex++
        if (exp.frameIndex < this.textures.explosions.length) {
          exp.sprite.texture = this.textures.explosions[exp.frameIndex]
        } else {
          exp.sprite.destroy()
          this.explosions.splice(i, 1)
        }
      }
    }
  }

  private createExplosion(x: number, y: number) {
    const sprite = new PIXI.Sprite(this.textures.explosions[0])
    sprite.anchor.set(0.5)
    sprite.position.set(x, y)
    this.gameContainer.addChild(sprite)

    this.explosions.push({
      sprite,
      frameIndex: 0,
      timer: 0,
    })
  }

  private checkCollisions() {
    // 1. Player Missiles vs Enemies
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx]
      if (!bullet.isPlayer) continue

      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const enemy = this.enemies[eIdx]
        const dist = Math.hypot(bullet.sprite.x - enemy.sprite.x, bullet.sprite.y - enemy.sprite.y)

        if (dist < 18) {
          // Hit!
          bullet.sprite.destroy()
          this.bullets.splice(bIdx, 1)

          enemy.health--
          if (enemy.health <= 0) {
            // Destroy Enemy
            sound.playExplosion()
            this.createExplosion(enemy.sprite.x, enemy.sprite.y)

            let pts = 50
            if (enemy.type === 'bee') pts = enemy.state === 'diving' ? 100 : 50
            else if (enemy.type === 'butterfly') pts = enemy.state === 'diving' ? 160 : 80
            else if (enemy.type === 'boss') pts = enemy.state === 'diving' ? 400 : 150

            this.addScore(pts)

            enemy.sprite.destroy()
            this.enemies.splice(eIdx, 1)
          } else {
            // Damaged Boss Galaga (turn blue)
            sound.playLaser()
            this.addScore(50)
            this.updateEnemyTexture(enemy)
          }
          break
        }
      }
    }

    // 2. Alien Bullets & Enemies vs Player
    if (this.isPlayerDead || this.invulnerableTimer > 0) return

    // Bullet vs Player
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx]
      if (bullet.isPlayer) continue

      const dist = Math.hypot(bullet.sprite.x - this.player.x, bullet.sprite.y - this.player.y)
      if (dist < 14) {
        bullet.sprite.destroy()
        this.bullets.splice(bIdx, 1)
        this.killPlayer()
        return
      }
    }

    // Enemy collision with Player
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.sprite.x - this.player.x, enemy.sprite.y - this.player.y)
      if (dist < 20) {
        sound.playExplosion()
        this.createExplosion(enemy.sprite.x, enemy.sprite.y)
        enemy.sprite.destroy()
        this.enemies = this.enemies.filter(e => e !== enemy)
        this.killPlayer()
        return
      }
    }
  }

  private killPlayer() {
    sound.playPlayerDeath()
    this.createExplosion(this.player.x, this.player.y)
    this.isPlayerDead = true
    this.player.visible = false
    this.lives--
    this.updateLifeIcons()
    this.respawnTimer = 110 // Respawn delay
  }

  private addScore(pts: number) {
    this.score += pts
    this.scoreText.text = `${this.score}`
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.highScoreText.text = `${this.highScore}`
      localStorage.setItem('dinamo_galaga_high_score', `${this.highScore}`)
    }
  }

  private checkWaveProgress() {
    if (this.waveQueue.length === 0 && this.enemies.length === 0 && !this.isStageIntro && !this.isGameOver) {
      // Wave Cleared!
      this.isStageIntro = true
      this.messageText.text = `STAGE CLEARED!`
      this.messageText.visible = true

      setTimeout(() => {
        this.startStage(this.stage + 1)
      }, 2000)
    }
  }

  private gameOver() {
    this.isGameOver = true
    this.messageText.text = `GAME OVER\n\nFINAL SCORE: ${this.score}\n\nPRESS FIRE TO PLAY`
    this.messageText.visible = true
  }
}
