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
      // Enters from upper left, loops in center, curves down and up into target
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
      // Mirror of top left
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
      // Enters from middle-left side, loops low, swoops up
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
      // Mirror of left side
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

// Generate dive-bomb trajectory swooping down towards playerX and sweeping away
export function getDivePath(start: Point, playerX: number, screenWidth: number, screenHeight: number): Point[] {
  const sweepDir = start.x > screenWidth / 2 ? -1 : 1
  const controls: Point[] = [
    { x: start.x, y: start.y },
    { x: start.x + sweepDir * 40, y: start.y - 20 },
    { x: start.x + sweepDir * 80, y: start.y + 60 },
    { x: playerX + sweepDir * 20, y: screenHeight * 0.55 },

    { x: playerX + sweepDir * 20, y: screenHeight * 0.55 },
    { x: playerX - sweepDir * 40, y: screenHeight * 0.8 },
    { x: playerX - sweepDir * 80, y: screenHeight + 50 },
    { x: screenWidth / 2 - sweepDir * 120, y: screenHeight + 80 },
  ]

  return generateSplinePath(controls, 30)
}
