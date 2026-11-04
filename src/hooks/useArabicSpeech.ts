import { useCallback, useEffect, useRef, useState } from 'react'
import { isGloballyMuted } from './useSound'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseArabicSpeechReturn {
  speak: (text: string) => void
  isSupported: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useArabicSpeech(): UseArabicSpeechReturn {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // Cache the best Arabic voice after voices load
  const arabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  // Listen to global mute changes
  useEffect(() => {
    if (!isSupported) return

    const handleMute = (e: Event) => {
      const custom = e as CustomEvent<{ isMuted: boolean }>
      if (custom.detail?.isMuted) {
        window.speechSynthesis.cancel()
      }
    }

    window.addEventListener('arabic-mute-changed', handleMute)
    return () => window.removeEventListener('arabic-mute-changed', handleMute)
  }, [isSupported])

  useEffect(() => {
    if (!isSupported) return

    const findArabicVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length === 0) return

      // Prefer a voice explicitly tagged with 'ar'
      const arVoice =
        voices.find((v) => v.lang.startsWith('ar')) ??
        voices.find((v) => v.lang.toLowerCase().includes('arab')) ??
        null

      arabicVoiceRef.current = arVoice
      setVoicesLoaded(true)
    }

    // Voices may already be available (Chrome populates synchronously sometimes)
    findArabicVoice()

    // Otherwise wait for the async event
    window.speechSynthesis.addEventListener('voiceschanged', findArabicVoice)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', findArabicVoice)
    }
  }, [isSupported])

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return

      // Always check if all sounds are muted
      if (isGloballyMuted()) {
        window.speechSynthesis.cancel()
        return
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar'
      utterance.rate = 0.85   // Slightly slower for learners
      utterance.pitch = 1.0
      utterance.volume = 1.0

      if (arabicVoiceRef.current) {
        utterance.voice = arabicVoiceRef.current
      }

      utterance.onerror = (e) => {
        // Speech cancellation or rapid interruptions are expected when switching sounds
        if (e.error === 'interrupted' || e.error === 'canceled') return
        console.warn('[useArabicSpeech] SpeechSynthesis error:', e.error)
      }

      window.speechSynthesis.speak(utterance)
    },
    // voicesLoaded triggers re-creation so arabicVoiceRef is fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSupported, voicesLoaded],
  )

  return { speak, isSupported }
}
