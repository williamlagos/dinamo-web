export interface LeaderboardEntry {
  rank?: number
  player: string
  score: number
  stage: number
  platform: string
}

export class LeaderboardClient {
  private baseUrl: string

  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl
  }

  async fetchTopScores(limit = 5): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/leaderboard?limit=${limit}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.scores || []
    } catch {
      // Gracefully silent if elements-server is offline
      return []
    }
  }

  async submitScore(player: string, score: number, stage: number, platform = 'web'): Promise<{ rank?: number } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, score, stage, platform }),
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }
}

export const leaderboard = new LeaderboardClient()
