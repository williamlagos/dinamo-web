// Web Audio API procedural retro & Game Boy chiptune synthesizer for Dinamo
export type AudioMode = 'gb' | 'arcade'

class SoundManager {
  private ctx: AudioContext | null = null
  public enabled: boolean = true
  public mode: AudioMode = 'gb'

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // Generate authentic Game Boy LFSR pseudo-random noise buffer (Channel 4)
  private createGBNoiseBuffer(duration: number, shortWidth: boolean = false): AudioBuffer | null {
    if (!this.ctx) return null
    const sampleRate = this.ctx.sampleRate
    const bufferSize = Math.floor(sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
    const data = buffer.getChannelData(0)

    // 15-bit LFSR initial shift register
    let lfsr = 0x7fff
    for (let i = 0; i < bufferSize; i++) {
      // Game Boy LFSR: xor bit 0 and bit 1
      const bit = (lfsr & 1) ^ ((lfsr >> 1) & 1)
      lfsr = (lfsr >> 1) | (bit << 14)
      if (shortWidth) {
        // In 7-bit mode, bit 6 is also replaced
        lfsr = (lfsr & ~0x40) | (bit << 6)
      }
      data[i] = (lfsr & 1) ? 0.8 : -0.8
    }
    return buffer
  }

  // Laser shot sound (GB Channel 1 pulse with pitch drop)
  playLaser() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'square'

    if (this.mode === 'gb') {
      // Game Boy Ch1 pulse sweep: 880Hz down to 220Hz with stepped envelope
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.10)

      gain.gain.setValueAtTime(0.20, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.10)
    } else {
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)
    }

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  // Enemy diving swoop sound (GB Channel 1 pitch sweep)
  playDive() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = this.mode === 'gb' ? 'square' : 'sawtooth'

    if (this.mode === 'gb') {
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.linearRampToValueAtTime(260, now + 0.18)
      osc.frequency.linearRampToValueAtTime(390, now + 0.35)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
    } else {
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.linearRampToValueAtTime(300, now + 0.25)
      osc.frequency.linearRampToValueAtTime(500, now + 0.5)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    }

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + (this.mode === 'gb' ? 0.36 : 0.52))
  }

  // Alien explosion (GB Channel 4 LFSR noise)
  playExplosion() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const duration = this.mode === 'gb' ? 0.20 : 0.25

    let buffer: AudioBuffer | null = null
    if (this.mode === 'gb') {
      buffer = this.createGBNoiseBuffer(duration, true) // 7-bit crunch
    } else {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration)
      buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    if (!buffer) return
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(this.mode === 'gb' ? 2400 : 1000, now)
    filter.frequency.exponentialRampToValueAtTime(100, now + duration)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    noise.start(now)
    noise.stop(now + duration + 0.01)
  }

  // Player death explosion (GB Channel 4 deep rumble)
  playPlayerDeath() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const duration = 0.45

    const buffer = this.createGBNoiseBuffer(duration, false)
    if (!buffer) return

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200, now)
    filter.frequency.exponentialRampToValueAtTime(60, now + duration)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)

    noise.start(now)
    noise.stop(now + duration + 0.01)
  }

  // Stage clear / intro arpeggio (GB Ch1 + Ch2 pulse arpeggio)
  playStageStart() {
    if (!this.enabled) return
    this.initCtx()
    if (!this.ctx) return

    const notes = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5
    const now = this.ctx.currentTime
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator()
      const gain = this.ctx!.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)

      gain.gain.setValueAtTime(0.12, now + idx * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.10)

      osc.connect(gain)
      gain.connect(this.ctx!.destination)

      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.11)
    })
  }
}

export const sound = new SoundManager()
