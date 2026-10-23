import * as PIXI from 'pixi.js'
import { GameTextures, ThemeType, generateTextures, getColorMapForTheme } from './textures'
import { sound } from './audio'
import { Point, getGBEntrancePath, getDivePath } from './paths'
import { leaderboard } from './leaderboard'

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
  public theme: ThemeType = 'dmg'
  public width = 160
  public height = 144

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

  // Timers & Formation
  private fireCooldown = 0
  private formationTime = 0
  private diveTimer = 0
  private waveQueue: { type: EnemyType; row: number; col: number; pathType: 'topLeft' | 'topRight' | 'leftSide' | 'rightSide' }[] = []
  private spawnCooldown = 0

  // HUD Labels
  private scoreText!: PIXI.Text
  private highScoreText!: PIXI.Text
  private stageText!: PIXI.Text
  private messageText!: PIXI.Text

  constructor(app: PIXI.Application, textures: GameTextures, theme: ThemeType = 'dmg') {
    this.app = app
    this.textures = textures
    this.theme = theme

    // Set up layer hierarchy
    this.app.stage.addChild(this.starContainer)
    this.app.stage.addChild(this.gameContainer)
    this.app.stage.addChild(this.hudContainer)
    this.app.stage.addChild(this.overlayContainer)

    // Load High Score from localStorage
    const savedHigh = localStorage.getItem('dinamo_galaga_high_score')
    if (savedHigh) {
      this.highScore = parseInt(savedHigh, 10) || 20000
    }

    this.setupStars()
    this.setupHUD()
    this.setupPlayer()
    this.applyThemeColors()
    this.startNewGame()
  }

  public setTheme(theme: ThemeType) {
    this.theme = theme
    this.textures = generateTextures(theme, 1)
    sound.mode = theme === 'arcade' ? 'arcade' : 'gb'

    this.applyThemeColors()
    this.updateLiveTextures()
  }

  private applyThemeColors() {
    const colors = getColorMapForTheme(this.theme)

    let bgColor = 0x081820
    let primaryTextColor = colors.W
    let secondaryTextColor = colors.B

    if (this.theme === 'pocket') {
      bgColor = 0x000000
      primaryTextColor = '#ffffff'
      secondaryTextColor = '#aaaaaa'
    } else if (this.theme === 'gbc') {
      bgColor = 0x081020
      primaryTextColor = '#f8d800'
      secondaryTextColor = '#00e8d8'
    } else if (this.theme === 'arcade') {
      bgColor = 0x05050d
      primaryTextColor = '#ffffff'
      secondaryTextColor = '#ff2222'
    } else {
      // dmg
      bgColor = 0x081820
      primaryTextColor = colors.W
      secondaryTextColor = colors.B
    }

    this.app.renderer.background.color = bgColor

    if (this.scoreText) {
      this.scoreText.style.fill = primaryTextColor
    }
    if (this.highScoreText) {
      this.highScoreText.style.fill = primaryTextColor
    }
    if (this.stageText) {
      this.stageText.style.fill = secondaryTextColor
    }
    if (this.messageText) {
      this.messageText.style.fill = primaryTextColor
    }

    // Refresh star palette
    this.setupStars()
  }

  private updateLiveTextures() {
    if (this.player) {
      this.player.texture = this.textures.player
    }
    for (const enemy of this.enemies) {
      this.updateEnemyTexture(enemy)
    }
    this.updateLifeIcons()
  }

  private setupStars() {
    this.starContainer.removeChildren()
    this.stars = []

    const numStars = 28
    const colors = getColorMapForTheme(this.theme)
    const starPalette = [
      PIXI.utils.string2hex(colors.W),
      PIXI.utils.string2hex(colors.B),
      PIXI.utils.string2hex(colors.R),
    ]

    for (let i = 0; i < numStars; i++) {
      const gfx = new PIXI.Graphics()
      const color = starPalette[i % starPalette.length]
      gfx.beginFill(color)
      gfx.drawRect(0, 0, 1, 1)
      gfx.endFill()

      gfx.x = Math.floor(Math.random() * this.width)
      gfx.y = Math.floor(Math.random() * this.height)

      this.starContainer.addChild(gfx)
      this.stars.push({
        gfx,
        speed: 8 + Math.random() * 22,
        twinkleTimer: Math.random() * 60,
      })
    }
  }

  private setupHUD() {
    const textStyle: Partial<PIXI.ITextStyle> = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 6,
      fill: '#e0f8d0',
      align: 'left',
    }

    const title1Up = new PIXI.Text('1UP', textStyle)
    title1Up.position.set(6, 4)
    this.hudContainer.addChild(title1Up)

    this.scoreText = new PIXI.Text('00', textStyle)
    this.scoreText.position.set(6, 12)
    this.hudContainer.addChild(this.scoreText)

    const titleHigh = new PIXI.Text('HIGH', textStyle)
    titleHigh.position.set(this.width / 2 - 12, 4)
    this.hudContainer.addChild(titleHigh)

    this.highScoreText = new PIXI.Text(`${this.highScore}`, textStyle)
    this.highScoreText.position.set(this.width / 2 - 12, 12)
    this.hudContainer.addChild(this.highScoreText)

    this.stageText = new PIXI.Text('ST 1', textStyle)
    this.stageText.position.set(this.width - 32, 12)
    this.hudContainer.addChild(this.stageText)

    this.messageText = new PIXI.Text('', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 8,
      fill: '#e0f8d0',
      align: 'center',
      lineHeight: 12,
    })
    this.messageText.anchor.set(0.5)
    this.messageText.position.set(this.width / 2, this.height / 2)
    this.overlayContainer.addChild(this.messageText)
  }

  private updateLifeIcons() {
    this.lifeIcons.forEach(icon => icon.destroy())
    this.lifeIcons = []

    for (let i = 0; i < Math.max(0, this.lives - 1); i++) {
      const icon = new PIXI.Sprite(this.textures.playerMini)
      icon.anchor.set(0.5)
      icon.position.set(10 + i * 10, this.height - 6)
      this.hudContainer.addChild(icon)
      this.lifeIcons.push(icon)
    }
  }

  private setupPlayer() {
    this.player = new PIXI.Sprite(this.textures.player)
    this.player.anchor.set(0.5)
    this.player.position.set(this.width / 2, this.height - 14)
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
    this.scoreText.text = '00'
    this.player.visible = true
    this.player.position.set(this.width / 2, this.height - 14)
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
    this.stageText.text = `ST ${stageNumber}`
    this.isStageIntro = true
    this.messageText.text = `STAGE ${stageNumber}\nREADY`
    this.messageText.visible = true

    sound.playStageStart()

    // Build the 10-ship armada wave plan matching GBGame
    this.buildWaveQueue()

    setTimeout(() => {
      this.isStageIntro = false
      this.messageText.visible = false
    }, 2000)
  }

  // Target positions for 10-ship armada (2 Bosses, 4 Escorts, 4 Bees)
  private getFormationSlot(row: number, col: number): Point {
    const gridStartX = 28
    const gridStartY = 24
    const colSpacing = 16
    const rowSpacing = 14
    return {
      x: gridStartX + col * colSpacing,
      y: gridStartY + row * rowSpacing,
    }
  }

  private buildWaveQueue() {
    this.waveQueue = []

    // 10-ship armada layout:
    // Row 0: 2 Bosses (cols 3, 4)
    // Row 1: 4 Red Escorts (cols 2, 3, 4, 5)
    // Row 2: 4 Blue Bees (cols 2, 3, 4, 5)
    this.waveQueue.push(
      { type: 'boss', row: 0, col: 3, pathType: 'topLeft' },
      { type: 'boss', row: 0, col: 4, pathType: 'topRight' },
      { type: 'butterfly', row: 1, col: 2, pathType: 'leftSide' },
      { type: 'butterfly', row: 1, col: 5, pathType: 'rightSide' },
      { type: 'butterfly', row: 1, col: 3, pathType: 'topLeft' },
      { type: 'butterfly', row: 1, col: 4, pathType: 'topRight' },
      { type: 'bee', row: 2, col: 2, pathType: 'leftSide' },
      { type: 'bee', row: 2, col: 5, pathType: 'rightSide' },
      { type: 'bee', row: 2, col: 3, pathType: 'topLeft' },
      { type: 'bee', row: 2, col: 4, pathType: 'topRight' }
    )
  }

  public update(delta: number) {
    this.updateStars(delta)

    if (this.isGameOver) {
      if (this.input.fire) {
        this.startNewGame()
      }
      return
    }

    this.updatePlayer(delta)
    this.updateWaveSpawn(delta)
    this.updateEnemies(delta)
    this.updateBullets(delta)
    this.updateExplosions(delta)
    this.checkCollisions()
    this.checkWaveProgress()
  }

  private updateStars(delta: number) {
    for (const star of this.stars) {
      star.gfx.y += (star.speed * delta) / 60
      if (star.gfx.y > this.height) {
        star.gfx.y = 0
        star.gfx.x = Math.floor(Math.random() * this.width)
      }
      star.twinkleTimer += delta
      if (star.twinkleTimer > 30) {
        star.twinkleTimer = 0
        star.gfx.alpha = 0.5 + Math.random() * 0.5
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
          this.player.position.set(this.width / 2, this.height - 14)
          this.invulnerableTimer = 120
        } else {
          this.gameOver()
        }
      }
      return
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta
      this.player.alpha = Math.floor(this.invulnerableTimer / 8) % 2 === 0 ? 0.4 : 1.0
    } else {
      this.player.alpha = 1.0
    }

    const speed = (90 * delta) / 60
    if (this.input.left) {
      this.player.x -= speed
    }
    if (this.input.right) {
      this.player.x += speed
    }

    // Keep player in bounds
    this.player.x = Math.max(10, Math.min(this.width - 10, this.player.x))

    // Player Shooting
    if (this.fireCooldown > 0) {
      this.fireCooldown -= delta
    }

    if (this.input.fire && this.fireCooldown <= 0 && !this.isStageIntro) {
      this.firePlayerLaser()
      this.fireCooldown = 15 // ~0.25s at 60fps
    }
  }

  private firePlayerLaser() {
    const activePlayerMissiles = this.bullets.filter(b => b.isPlayer).length
    if (activePlayerMissiles >= 2) return // Game Boy 2-bullet limit

    sound.playLaser()

    const missile = new PIXI.Sprite(this.textures.playerLaser)
    missile.anchor.set(0.5)
    missile.position.set(this.player.x, this.player.y - 8)
    this.gameContainer.addChild(missile)

    this.bullets.push({
      sprite: missile,
      vx: 0,
      vy: -180,
      isPlayer: true,
    })
  }

  private updateWaveSpawn(delta: number) {
    if (this.isStageIntro || this.waveQueue.length === 0) return

    this.spawnCooldown -= delta
    if (this.spawnCooldown <= 0) {
      const item = this.waveQueue.shift()!
      this.spawnCooldown = 22 // Delay between ship spawns

      const slot = this.getFormationSlot(item.row, item.col)
      const path = getGBEntrancePath(item.pathType, slot)
      this.spawnEnemy(item.type, item.row, item.col, slot, path)
    }
  }

  private spawnEnemy(type: EnemyType, row: number, col: number, slot: Point, path: Point[]) {
    const sprite = new PIXI.Sprite(this.getEnemyTexture(type, 1, 2))
    sprite.anchor.set(0.5)
    sprite.position.set(path[0].x, path[0].y)
    this.gameContainer.addChild(sprite)

    this.enemies.push({
      sprite,
      type,
      row,
      col,
      targetSlot: slot,
      state: 'entering',
      health: type === 'boss' ? 2 : 1,
      path,
      pathIndex: 0,
      frameTimer: 0,
      currentFrame: 1,
      hasFired: false,
    })
  }

  private getEnemyTexture(type: EnemyType, frame: number, health: number): PIXI.Texture {
    if (type === 'bee') {
      return frame === 1 ? this.textures.bee1 : this.textures.bee2
    }
    if (type === 'butterfly') {
      return frame === 1 ? this.textures.butterfly1 : this.textures.butterfly2
    }
    if (health === 1) {
      return frame === 1 ? this.textures.bossBlue1 : this.textures.bossBlue2
    }
    return frame === 1 ? this.textures.bossGreen1 : this.textures.bossGreen2
  }

  private updateEnemyTexture(enemy: Enemy) {
    enemy.sprite.texture = this.getEnemyTexture(enemy.type, enemy.currentFrame, enemy.health)
  }

  private updateEnemies(delta: number) {
    this.formationTime += (delta * 2.2) / 60
    const swayX = Math.sin(this.formationTime) * 6
    const swayY = Math.cos(this.formationTime * 1.5) * 2

    // Dive attack timer
    this.diveTimer += delta
    if (this.diveTimer > 120 && !this.isStageIntro) {
      this.diveTimer = 0
      this.triggerEnemyDive()
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]

      // Animation frames
      enemy.frameTimer += delta
      if (enemy.frameTimer > 15) {
        enemy.frameTimer = 0
        enemy.currentFrame = enemy.currentFrame === 1 ? 2 : 1
        this.updateEnemyTexture(enemy)
      }

      if (enemy.state === 'entering') {
        enemy.pathIndex += 1
        if (enemy.pathIndex < enemy.path.length) {
          const pt = enemy.path[enemy.pathIndex]
          enemy.sprite.x = pt.x
          enemy.sprite.y = pt.y
        } else {
          enemy.state = 'formation'
        }
      } else if (enemy.state === 'formation') {
        enemy.sprite.x = enemy.targetSlot.x + swayX
        enemy.sprite.y = enemy.targetSlot.y + swayY
        enemy.sprite.rotation = 0
      } else if (enemy.state === 'diving') {
        enemy.pathIndex += 1
        if (enemy.pathIndex < enemy.path.length) {
          const pt = enemy.path[enemy.pathIndex]
          const dx = pt.x - enemy.sprite.x
          const dy = pt.y - enemy.sprite.y
          enemy.sprite.rotation = Math.atan2(dy, dx) - Math.PI / 2
          enemy.sprite.x = pt.x
          enemy.sprite.y = pt.y

          // Enemy fires a bullet mid-dive
          if (!enemy.hasFired && pt.y > this.height * 0.4 && pt.y < this.height * 0.7) {
            enemy.hasFired = true
            this.fireAlienBullet(enemy.sprite.x, enemy.sprite.y)
          }
        } else {
          // Wrapped around bottom of screen, return to formation
          enemy.state = 'returning'
          enemy.sprite.rotation = 0
          enemy.hasFired = false
          enemy.sprite.y = -10
          enemy.sprite.x = enemy.targetSlot.x
        }
      } else if (enemy.state === 'returning') {
        enemy.sprite.y += (70 * delta) / 60
        if (enemy.sprite.y >= enemy.targetSlot.y) {
          enemy.state = 'formation'
        }
      }
    }
  }

  private triggerEnemyDive() {
    const formationEnemies = this.enemies.filter(e => e.state === 'formation')
    if (formationEnemies.length === 0) return

    const diver = formationEnemies[Math.floor(Math.random() * formationEnemies.length)]
    diver.state = 'diving'
    diver.path = getDivePath(
      { x: diver.sprite.x, y: diver.sprite.y },
      this.player.x,
      this.width,
      this.height
    )
    diver.pathIndex = 0
    diver.hasFired = false
    sound.playDive()
  }

  private fireAlienBullet(x: number, y: number) {
    const bullet = new PIXI.Sprite(this.textures.alienBullet)
    bullet.anchor.set(0.5)
    bullet.position.set(x, y)
    this.gameContainer.addChild(bullet)

    this.bullets.push({
      sprite: bullet,
      vx: 0,
      vy: 110,
      isPlayer: false,
    })
  }

  private updateBullets(delta: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.sprite.y += (b.vy * delta) / 60
      b.sprite.x += (b.vx * delta) / 60

      if (b.sprite.y < -10 || b.sprite.y > this.height + 10 || b.sprite.x < -10 || b.sprite.x > this.width + 10) {
        b.sprite.destroy()
        this.bullets.splice(i, 1)
      }
    }
  }

  private updateExplosions(delta: number) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i]
      exp.timer += delta
      if (exp.timer > 5) {
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

        if (dist < 10) {
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
            // Damaged Boss (turn blue)
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
      if (dist < 8) {
        bullet.sprite.destroy()
        this.bullets.splice(bIdx, 1)
        this.killPlayer()
        return
      }
    }

    // Enemy collision with Player
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.sprite.x - this.player.x, enemy.sprite.y - this.player.y)
      if (dist < 12) {
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
    this.respawnTimer = 90
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
      this.isStageIntro = true
      this.messageText.text = `STAGE CLEARED!`
      this.messageText.visible = true

      setTimeout(() => {
        this.startStage(this.stage + 1)
      }, 1800)
    }
  }

  private gameOver() {
    this.isGameOver = true
    this.messageText.text = `GAME OVER\nSCORE: ${this.score}\nFIRE TO PLAY`
    this.messageText.visible = true

    if (this.score > 0) {
      leaderboard.submitScore('YOU', this.score, this.stage, 'web').then(res => {
        if (res && res.rank) {
          this.messageText.text = `GAME OVER\nSCORE: ${this.score}\nRANK: #${res.rank}\nFIRE TO PLAY`
        }
      })
    }
  }
}
