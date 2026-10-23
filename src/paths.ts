export interface Point {
  x: number
  y: number
}

// Evaluate cubic Bézier curve at parameter t in [0, 1]
export function evaluateCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  const t2 = t * t
  const t3 = t2 * t

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  }
}

// Generate an array of sample points along connected cubic Bézier segments
export function generateSplinePath(controlPoints: Point[], samplesPerSegment = 40): Point[] {
  const path: Point[] = []
  if (controlPoints.length < 4) return controlPoints

  for (let i = 0; i <= controlPoints.length - 4; i += 3) {
    const p0 = controlPoints[i]
    const p1 = controlPoints[i + 1]
    const p2 = controlPoints[i + 2]
    const p3 = controlPoints[i + 3]

    for (let s = 0; s <= samplesPerSegment; s++) {
      if (s === 0 && path.length > 0) continue // Skip duplicate junction
      const t = s / samplesPerSegment
      path.push(evaluateCubicBezier(p0, p1, p2, p3, t))
    }
  }

  return path
}

// Standard entrance paths for width=448, height=600
export function getEntrancePath(pathType: 'topLeft' | 'topRight' | 'leftSide' | 'rightSide', target: Point): Point[] {
  let controls: Point[] = []

  switch (pathType) {
    case 'topLeft':
      controls = [
        { x: 100, y: -40 },
        { x: 140, y: 150 },
        { x: 300, y: 220 },
        { x: 260, y: 320 },

        { x: 260, y: 320 },
        { x: 220, y: 400 },
        { x: 120, y: 380 },
        { x: 150, y: 280 },

        { x: 150, y: 280 },
        { x: 190, y: 180 },
        { x: target.x, y: target.y + 80 },
        { x: target.x, y: target.y },
      ]
      break

    case 'topRight':
      controls = [
        { x: 348, y: -40 },
        { x: 308, y: 150 },
        { x: 148, y: 220 },
        { x: 188, y: 320 },

        { x: 188, y: 320 },
        { x: 228, y: 400 },
        { x: 328, y: 380 },
        { x: 298, y: 280 },

        { x: 298, y: 280 },
        { x: 258, y: 180 },
        { x: target.x, y: target.y + 80 },
        { x: target.x, y: target.y },
      ]
      break

    case 'leftSide':
      controls = [
        { x: -40, y: 380 },
        { x: 160, y: 420 },
        { x: 280, y: 480 },
        { x: 300, y: 360 },

        { x: 300, y: 360 },
        { x: 320, y: 240 },
        { x: target.x, y: target.y + 70 },
        { x: target.x, y: target.y },
      ]
      break

    case 'rightSide':
      controls = [
        { x: 488, y: 380 },
        { x: 288, y: 420 },
        { x: 168, y: 480 },
        { x: 148, y: 360 },

        { x: 148, y: 360 },
        { x: 128, y: 240 },
        { x: target.x, y: target.y + 70 },
        { x: target.x, y: target.y },
      ]
      break
  }

  return generateSplinePath(controls, 35)
}

// Game Boy 160x144 entrance paths
export function getGBEntrancePath(pathType: 'topLeft' | 'topRight' | 'leftSide' | 'rightSide', target: Point): Point[] {
  let controls: Point[] = []

  switch (pathType) {
    case 'topLeft':
      controls = [
        { x: 30, y: -20 },
        { x: 45, y: 35 },
        { x: 110, y: 55 },
        { x: 95, y: 80 },
        { x: 95, y: 80 },
        { x: 80, y: 105 },
        { x: 40, y: 95 },
        { x: 50, y: 70 },
        { x: 50, y: 70 },
        { x: 65, y: 45 },
        { x: target.x, y: target.y + 20 },
        { x: target.x, y: target.y },
      ]
      break

    case 'topRight':
      controls = [
        { x: 130, y: -20 },
        { x: 115, y: 35 },
        { x: 50, y: 55 },
        { x: 65, y: 80 },
        { x: 65, y: 80 },
        { x: 80, y: 105 },
        { x: 120, y: 95 },
        { x: 110, y: 70 },
        { x: 110, y: 70 },
        { x: 95, y: 45 },
        { x: target.x, y: target.y + 20 },
        { x: target.x, y: target.y },
      ]
      break

    case 'leftSide':
      controls = [
        { x: -20, y: 95 },
        { x: 55, y: 105 },
        { x: 100, y: 120 },
        { x: 105, y: 90 },
        { x: 105, y: 90 },
        { x: 110, y: 60 },
        { x: target.x, y: target.y + 20 },
        { x: target.x, y: target.y },
      ]
      break

    case 'rightSide':
      controls = [
        { x: 180, y: 95 },
        { x: 105, y: 105 },
        { x: 60, y: 120 },
        { x: 55, y: 90 },
        { x: 55, y: 90 },
        { x: 50, y: 60 },
        { x: target.x, y: target.y + 20 },
        { x: target.x, y: target.y },
      ]
      break
  }

  return generateSplinePath(controls, 20)
}

// Generate dive-bomb trajectory swooping down towards playerX and sweeping away
export function getDivePath(start: Point, playerX: number, screenWidth: number, screenHeight: number): Point[] {
  const sweepDir = start.x > screenWidth / 2 ? -1 : 1
  const xOffset = screenWidth <= 160 ? 15 : 40
  const yOffset = screenWidth <= 160 ? 8 : 20

  const controls: Point[] = [
    { x: start.x, y: start.y },
    { x: start.x + sweepDir * xOffset, y: start.y - yOffset },
    { x: start.x + sweepDir * xOffset * 2, y: start.y + yOffset * 3 },
    { x: playerX + sweepDir * (xOffset / 2), y: screenHeight * 0.55 },

    { x: playerX + sweepDir * (xOffset / 2), y: screenHeight * 0.55 },
    { x: playerX - sweepDir * xOffset, y: screenHeight * 0.8 },
    { x: playerX - sweepDir * xOffset * 2, y: screenHeight + yOffset * 2 },
    { x: screenWidth / 2 - sweepDir * xOffset * 3, y: screenHeight + yOffset * 3 },
  ]

  return generateSplinePath(controls, 25)
}
