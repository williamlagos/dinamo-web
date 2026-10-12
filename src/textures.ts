import * as PIXI from 'pixi.js'

// Helper to draw pixel matrices onto a canvas and return a PIXI.Texture
function createPixelTexture(
  width: number,
  height: number,
  pixels: string[],
  colorMap: Record<string, string>,
  scale = 2
): PIXI.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  for (let y = 0; y < height; y++) {
    const row = pixels[y] || ''
    for (let x = 0; x < width; x++) {
      const char = row[x] || ' '
      if (char !== ' ' && colorMap[char]) {
        ctx.fillStyle = colorMap[char]
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }

  const texture = PIXI.Texture.from(canvas)
  texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
  return texture
}

export interface GameTextures {
  player: PIXI.Texture
  playerMini: PIXI.Texture
  bee1: PIXI.Texture
  bee2: PIXI.Texture
  butterfly1: PIXI.Texture
  butterfly2: PIXI.Texture
  bossGreen1: PIXI.Texture
  bossGreen2: PIXI.Texture
  bossBlue1: PIXI.Texture
  bossBlue2: PIXI.Texture
  playerLaser: PIXI.Texture
  alienBullet: PIXI.Texture
  explosions: PIXI.Texture[]
}

export function generateTextures(): GameTextures {
  const colors = {
    W: '#FFFFFF', // White
    R: '#FF2222', // Bright Red
    B: '#2277FF', // Blue
    Y: '#FFE000', // Yellow
    G: '#00DD44', // Green
    C: '#22FFFF', // Cyan
    O: '#FF8800', // Orange
    P: '#AA44FF', // Purple
    D: '#444444', // Dark gray
  }

  // --- PLAYER FIGHTER (15 x 16) ---
  const playerPixels = [
    '       W       ',
    '       W       ',
    '      BWB      ',
    '      BWB      ',
    '     WWBWB     ',
    '     WWWWW     ',
    '    WWWWWWW    ',
    '    WWWRWWW    ',
    ' R WWWWWWWWWR  ',
    'RR WWWWWWWWWRR ',
    'RR WWWRRRWWW RR',
    'RRWWWW   WWWW RR',
    ' RRR       RRR ',
    ' R           R ',
    '               ',
    '               ',
  ]
  const player = createPixelTexture(15, 16, playerPixels, colors, 2)
  const playerMini = createPixelTexture(15, 16, playerPixels, colors, 1)

  // --- BEE / ZAKO (Yellow alien) (16 x 16) Frame 1 & 2 ---
  const bee1Pixels = [
    '      YYYY      ',
    '    YYRRRRYY    ',
    '   YYYRRRRYYY   ',
    '   YY RRRR YY   ',
    '  YYYYYYYYYYYY  ',
    ' YYYYYYWWYYYYYY ',
    ' YYY YYYYYY YYY ',
    'YYYY YY  YY YYYY',
    'YYYY   YY   YYYY',
    ' YYYY  YY  YYYY ',
    '  YYYYYYYYYYYY  ',
    '   YYRRRRYY     ',
    '    YYRRYY      ',
    '     YYYY       ',
    '      YY        ',
    '                ',
  ]

  const bee2Pixels = [
    '      YYYY      ',
    '    YYRRRRYY    ',
    '  YYYYRRRRYYYY  ',
    ' YYYY RRRR YYYY ',
    ' YYYYYYYYYYYYYY ',
    '  YYYYYWWYYYYY  ',
    '  YY YYYYYY YY  ',
    '   Y YY  YY Y   ',
    '   Y   YY   Y   ',
    '   YY  YY  YY   ',
    '  YYYYYYYYYYYY  ',
    '   YYRRRRYY     ',
    '    YYRRYY      ',
    '     YYYY       ',
    '      YY        ',
    '                ',
  ]
  const bee1 = createPixelTexture(16, 16, bee1Pixels, colors, 2)
  const bee2 = createPixelTexture(16, 16, bee2Pixels, colors, 2)

  // --- BUTTERFLY / GOEI (Red alien) (16 x 16) Frame 1 & 2 ---
  const bfly1Pixels = [
    '      CCCC      ',
    '    CCRRRRCC    ',
    '   CCCRRRRCCC   ',
    '  CCCCRRRRCCCC  ',
    ' CCCCCRRRRCCCCC ',
    ' CCCCCWWWWCCCCC ',
    ' CCCCCRRRRCCCCC ',
    '  CC RRRRRR CC  ',
    '   RRR    RRR   ',
    '  RRRR    RRRR  ',
    ' RRRRR    RRRRR ',
    ' RRR        RRR ',
    '  RR        RR  ',
    '   R        R   ',
    '                ',
    '                ',
  ]

  const bfly2Pixels = [
    '      CCCC      ',
    '    CCRRRRCC    ',
    '  CCCCRRRRCCCC  ',
    ' CCC CCRRCC CCC ',
    'CCCC CCRRCC CCCC',
    'CCCC CWWWWCC CCCC',
    ' CCC CCRRCC CCC ',
    '  CC RRRRRR CC  ',
    '  RRRR    RRRR  ',
    ' RRRRR    RRRRR ',
    ' RRR        RRR ',
    '  RR        RR  ',
    '   R        R   ',
    '                ',
    '                ',
    '                ',
  ]
  const butterfly1 = createPixelTexture(16, 16, bfly1Pixels, colors, 2)
  const butterfly2 = createPixelTexture(16, 16, bfly2Pixels, colors, 2)

  // --- BOSS GALAGA (Green - Healthy) (16 x 16) Frame 1 & 2 ---
  const bossG1Pixels = [
    '      GGGG      ',
    '    GGYYYYGG    ',
    '   GGGYYYYGGG   ',
    '  GGGGYYYYGGGG  ',
    ' GGGGGGGGGGGGGG ',
    ' GGGGYYWWYYGGGG ',
    ' GGG GGGGGG GGG ',
    'GGG  GG  GG  GGG',
    'GG   GGGGGG   GG',
    'GG   GGGGGG   GG',
    ' GGG  GGGG  GGG ',
    '  GGGG    GGGG  ',
    '   GGG    GGG   ',
    '    GG    GG    ',
    '     G    G     ',
    '                ',
  ]

  const bossG2Pixels = [
    '      GGGG      ',
    '    GGYYYYGG    ',
    '  GGGGYYYYGGGG  ',
    ' GGG GYYYYG GGG ',
    'GGGG GGGGGG GGGG',
    'GGGG YYWWYY GGGG',
    ' GGG GGGGGG GGG ',
    ' GGG GG  GG GGG ',
    '  GG GGGGGG GG  ',
    '  GG GGGGGG GG  ',
    '   GG GGGG GG   ',
    '   GG      GG   ',
    '    G      G    ',
    '                ',
    '                ',
    '                ',
  ]
  const bossGreen1 = createPixelTexture(16, 16, bossG1Pixels, colors, 2)
  const bossGreen2 = createPixelTexture(16, 16, bossG2Pixels, colors, 2)

  // --- BOSS GALAGA (Blue - Damaged) ---
  const bossB1Pixels = bossG1Pixels.map(row => row.replace(/G/g, 'B'))
  const bossB2Pixels = bossG2Pixels.map(row => row.replace(/G/g, 'B'))
  const bossBlue1 = createPixelTexture(16, 16, bossB1Pixels, colors, 2)
  const bossBlue2 = createPixelTexture(16, 16, bossB2Pixels, colors, 2)

  // --- PLAYER MISSILE (Twin Laser) (5 x 12) ---
  const laserPixels = [
    'R R',
    'Y Y',
    'Y Y',
    'W W',
    'W W',
    'Y Y',
    'Y Y',
    'R R',
  ]
  const playerLaser = createPixelTexture(3, 8, laserPixels, colors, 2)

  // --- ALIEN BULLET (3 x 6) ---
  const bulletPixels = [
    ' O ',
    'OOO',
    'OWO',
    'OOO',
    ' O ',
  ]
  const alienBullet = createPixelTexture(3, 5, bulletPixels, colors, 2)

  // --- EXPLOSIONS (4 frames) ---
  const exp1 = [
    '     ',
    '  W  ',
    '     ',
  ]
  const exp2 = [
    '  Y  ',
    ' YWY ',
    '  Y  ',
  ]
  const exp3 = [
    ' R O R ',
    '  YWY  ',
    'OW W WO',
    '  YWY  ',
    ' R O R ',
  ]
  const exp4 = [
    'R  O  R',
    ' Y   Y ',
    'O  W  O',
    ' Y   Y ',
    'R  O  R',
  ]
  const explosions = [
    createPixelTexture(5, 3, exp1, colors, 3),
    createPixelTexture(5, 5, exp2, colors, 3),
    createPixelTexture(7, 5, exp3, colors, 3),
    createPixelTexture(7, 5, exp4, colors, 3),
  ]

  return {
    player,
    playerMini,
    bee1,
    bee2,
    butterfly1,
    butterfly2,
    bossGreen1,
    bossGreen2,
    bossBlue1,
    bossBlue2,
    playerLaser,
    alienBullet,
    explosions,
  }
}
