import { useCallback } from 'react'
import confetti from 'canvas-confetti'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseConfettiReturn {
  celebrate: () => void
  celebrateBig: () => void
}

// ---------------------------------------------------------------------------
// Colour palette — warm / friendly
// ---------------------------------------------------------------------------

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConfetti(): UseConfettiReturn {
  /**
   * Moderate confetti burst — good for a correct answer or minor win.
   */
  const celebrate = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: COLORS,
      scalar: 1.1,
      gravity: 1,
    })
  }, [])

  /**
   * Full celebration — multiple bursts for game completion.
   */
  const celebrateBig = useCallback(() => {
    // Centre burst
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.55 },
      colors: COLORS,
      scalar: 1.3,
    })

    // Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: COLORS,
      })
    }, 250)

    // Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: COLORS,
      })
    }, 400)

    // Final shower
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { x: 0.5, y: 0.3 },
        colors: COLORS,
        scalar: 0.9,
        gravity: 0.8,
        ticks: 300,
      })
    }, 700)
  }, [])

  return { celebrate, celebrateBig }
}
