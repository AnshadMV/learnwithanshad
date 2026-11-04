import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'arabic-mute'

// ---------------------------------------------------------------------------
// Tiny AudioContext singleton (created lazily on first interaction)
// ---------------------------------------------------------------------------

let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null

  if (!sharedCtx) {
    sharedCtx = new AudioCtx()
  }

  // Resume if suspended (browser autoplay policy)
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => undefined)
  }

  return sharedCtx
}

// ---------------------------------------------------------------------------
// Low-level tone generator
// ---------------------------------------------------------------------------

interface ToneOptions {
  startFreq: number
  endFreq?: number
  duration: number   // seconds
  volume?: number    // 0–1
  type?: OscillatorType
  delay?: number     // seconds, default 0
}

function playTone(opts: ToneOptions): void {
  const ctx = getAudioContext()
  if (!ctx) return

  const {
    startFreq,
    endFreq = startFreq,
    duration,
    volume = 0.3,
    type = 'sine',
    delay = 0,
  } = opts

  const now = ctx.currentTime + delay

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(startFreq, now)
  if (endFreq !== startFreq) {
    oscillator.frequency.linearRampToValueAtTime(endFreq, now + duration * 0.8)
  }

  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

// ---------------------------------------------------------------------------
// Named sound presets
// ---------------------------------------------------------------------------

function soundCorrect(): void {
  // Pleasant ascending two-tone beep
  playTone({ startFreq: 440, endFreq: 660, duration: 0.25, volume: 0.25 })
  playTone({ startFreq: 660, endFreq: 880, duration: 0.2, volume: 0.2, delay: 0.2 })
}

function soundWrong(): void {
  // Descending "oops" tone
  playTone({ startFreq: 440, endFreq: 330, duration: 0.35, type: 'sawtooth', volume: 0.2 })
}

function soundComplete(): void {
  // Short celebratory arpeggio C-E-G-C
  const notes = [261.63, 329.63, 392, 523.25]
  notes.forEach((freq, i) => {
    playTone({ startFreq: freq, duration: 0.18, volume: 0.22, delay: i * 0.15 })
  })
}

function soundClick(): void {
  playTone({ startFreq: 200, duration: 0.07, volume: 0.15, type: 'square' })
}

function soundPop(): void {
  // Bubbly pop sound
  playTone({ startFreq: 300, endFreq: 600, duration: 0.08, volume: 0.2, type: 'sine' })
}

function soundStar(): void {
  // Twinkle high bell
  playTone({ startFreq: 880, endFreq: 1100, duration: 0.15, volume: 0.18, type: 'triangle' })
  playTone({ startFreq: 1320, duration: 0.2, volume: 0.22, delay: 0.08, type: 'sine' })
}

function soundCoin(): void {
  // Sparkly coin pickup: B5 -> E6
  playTone({ startFreq: 987.77, duration: 0.08, volume: 0.25, type: 'sine' })
  playTone({ startFreq: 1318.51, duration: 0.25, volume: 0.28, delay: 0.08, type: 'sine' })
}

function soundWhoosh(): void {
  // Gentle airy frequency sweep
  playTone({ startFreq: 300, endFreq: 750, duration: 0.18, volume: 0.12, type: 'sine' })
}

function soundSparkle(): void {
  // Magical harp cascade
  const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51]
  chords.forEach((freq, idx) => {
    playTone({ startFreq: freq, duration: 0.14, volume: 0.15, delay: idx * 0.05, type: 'triangle' })
  })
}

function soundBoing(): void {
  // Fun spring wobble
  playTone({ startFreq: 180, endFreq: 320, duration: 0.12, volume: 0.2, type: 'sine' })
  playTone({ startFreq: 320, endFreq: 220, duration: 0.16, volume: 0.18, delay: 0.1, type: 'triangle' })
}

function soundFanfare(): void {
  // Grand victory fanfare
  const melody = [
    { freq: 392.0, dur: 0.12, delay: 0 },
    { freq: 523.25, dur: 0.12, delay: 0.12 },
    { freq: 659.25, dur: 0.12, delay: 0.24 },
    { freq: 783.99, dur: 0.35, delay: 0.36 },
  ]
  melody.forEach(n => {
    playTone({ startFreq: n.freq, duration: n.dur, volume: 0.24, delay: n.delay, type: 'triangle' })
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSoundReturn {
  playCorrect: () => void
  playWrong: () => void
  playComplete: () => void
  playClick: () => void
  playPop: () => void
  playStar: () => void
  playCoin: () => void
  playWhoosh: () => void
  playSparkle: () => void
  playBoing: () => void
  playFanfare: () => void
  isMuted: boolean
  toggleMute: () => void
  setMuted: (muted: boolean) => void
}

export function isGloballyMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setGlobalMute(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, String(muted))
    window.dispatchEvent(new CustomEvent('arabic-mute-changed', { detail: { isMuted: muted } }))
  } catch {}
}

export function useSound(): UseSoundReturn {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  // Keep a ref so callbacks stay stable and always read latest value
  const isMutedRef = useRef(isMuted)
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  // Sync with global custom event
  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const custom = e as CustomEvent<{ isMuted: boolean }>
      if (typeof custom.detail?.isMuted === 'boolean') {
        setIsMuted(custom.detail.isMuted)
      }
    }
    window.addEventListener('arabic-mute-changed', handleMuteChange)
    return () => window.removeEventListener('arabic-mute-changed', handleMuteChange)
  }, [])

  const setMuted = useCallback((muted: boolean) => {
    setGlobalMute(muted)
    setIsMuted(muted)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      setGlobalMute(next)
      return next
    })
  }, [])

  const guard = useCallback((fn: () => void) => {
    if (!isMutedRef.current) fn()
  }, [])

  const playCorrect  = useCallback(() => guard(soundCorrect),  [guard])
  const playWrong    = useCallback(() => guard(soundWrong),    [guard])
  const playComplete = useCallback(() => guard(soundComplete), [guard])
  const playClick    = useCallback(() => guard(soundClick),    [guard])
  const playPop      = useCallback(() => guard(soundPop),      [guard])
  const playStar     = useCallback(() => guard(soundStar),     [guard])
  const playCoin     = useCallback(() => guard(soundCoin),     [guard])
  const playWhoosh   = useCallback(() => guard(soundWhoosh),   [guard])
  const playSparkle  = useCallback(() => guard(soundSparkle),  [guard])
  const playBoing    = useCallback(() => guard(soundBoing),    [guard])
  const playFanfare  = useCallback(() => guard(soundFanfare),  [guard])

  return {
    playCorrect,
    playWrong,
    playComplete,
    playClick,
    playPop,
    playStar,
    playCoin,
    playWhoosh,
    playSparkle,
    playBoing,
    playFanfare,
    isMuted,
    toggleMute,
    setMuted,
  }
}
