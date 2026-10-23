import * as PIXI from 'pixi.js'
import palettesData from './palettes.json'

export type ThemeType = 'dmg' | 'pocket' | 'gbc' | 'arcade'

// Helper to draw pixel matrices onto a canvas and return a PIXI.Texture
function createPixelTexture(
  width: number,
  height: number,
  pixels: string[],
  colorMap: Record<string, string>,
  scale = 1
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

export function getColorMapForTheme(theme: ThemeType): Record<string, string> {
  const dmg = palettesData.palettes.dmg.colors
  const pocket = palettesData.palettes.pocket.colors

  switch (theme) {
    case 'dmg':
      return {
        W: dmg.lightest, // #e0f8d0
        C: dmg.lightest,
        B: dmg.light,    // #88c070
        Y: dmg.light,
        G: dmg.light,
        R: dmg.dark,     // #346856
        O: dmg.dark,
        P: dmg.dark,
        D: dmg.darkest,  // #081820
      }

    case 'pocket':
      return {
        W: pocket.lightest, // #ffffff
        C: pocket.lightest,
        B: pocket.light,    // #aaaaaa
        Y: pocket.light,
        G: pocket.light,
        R: pocket.dark,     // #555555
        O: pocket.dark,
        P: pocket.dark,
        D: pocket.darkest,  // #000000
      }

    case 'gbc':
      return {
        W: '#ffffff',
        R: '#d82800',
        B: '#0068f8',
        Y: '#f8d800',
        G: '#00e848',
        C: '#00e8d8',
        O: '#f88800',
        P: '#b80040',
        D: '#181828',
      }

    case 'arcade':
    default:
      return {
        W: '#FFFFFF',
        R: '#FF2222',
        B: '#2277FF',
        Y: '#FFE000',
        G: '#00DD44',
        C: '#22FFFF',
        O: '#FF8800',
        P: '#AA44FF',
        D: '#444444',
      }
  }
}

export function generateTextures(theme: ThemeType = 'dmg', scale = 1): GameTextures {
  const colors = getColorMapForTheme(theme)

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
  const player = createPixelTexture(15, 16, playerPixels, colors, scale)
  const playerMini = createPixelTexture(15, 16, playerPixels, colors, Math.max(1, Math.floor(scale / 2)))

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
  const bee1 = createPixelTexture(16, 16, bee1Pixels, colors, scale)
  const bee2 = createPixelTexture(16, 16, bee2Pixels, colors, scale)

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
  const butterfly1 = createPixelTexture(16, 16, bfly1Pixels, colors, scale)
  const butterfly2 = createPixelTexture(16, 16, bfly2Pixels, colors, scale)

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
  const bossGreen1 = createPixelTexture(16, 16, bossG1Pixels, colors, scale)
  const bossGreen2 = createPixelTexture(16, 16, bossG2Pixels, colors, scale)

  // --- BOSS GALAGA (Blue - Damaged) ---
  const bossB1Pixels = bossG1Pixels.map(row => row.replace(/G/g, 'B'))
  const bossB2Pixels = bossG2Pixels.map(row => row.replace(/G/g, 'B'))
  const bossBlue1 = createPixelTexture(16, 16, bossB1Pixels, colors, scale)
  const bossBlue2 = createPixelTexture(16, 16, bossB2Pixels, colors, scale)

  // --- PLAYER MISSILE (Twin Laser) (3 x 8) ---
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
  const playerLaser = createPixelTexture(3, 8, laserPixels, colors, scale)

  // --- ALIEN BULLET (3 x 5) ---
  const bulletPixels = [
    ' O ',
    'OOO',
    'OWO',
    'OOO',
    ' O ',
  ]
  const alienBullet = createPixelTexture(3, 5, bulletPixels, colors, scale)

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
    createPixelTexture(5, 3, exp1, colors, Math.max(1, scale)),
    createPixelTexture(5, 5, exp2, colors, Math.max(1, scale)),
    createPixelTexture(7, 5, exp3, colors, Math.max(1, scale)),
    createPixelTexture(7, 5, exp4, colors, Math.max(1, scale)),
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
