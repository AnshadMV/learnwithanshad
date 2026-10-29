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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseSoundReturn {
  playCorrect: () => void
  playWrong: () => void
  playComplete: () => void
  playClick: () => void
  isMuted: boolean
  toggleMute: () => void
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

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch { /* ignore */ }
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

  return { playCorrect, playWrong, playComplete, playClick, isMuted, toggleMute }
}
