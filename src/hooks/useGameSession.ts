import { useCallback, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateAccuracy, getStarsFromAccuracy } from '@/lib/utils'
import type { GameResult } from '@/types'
import { useAuth } from './useAuth'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SessionStatus = 'idle' | 'playing' | 'completed'

export interface GameSessionOptions {
  gameSlug: string
  letterId?: string
}

export interface UseGameSessionReturn {
  score: number
  questionsTotal: number
  questionsCorrect: number
  startTime: Date | null
  status: SessionStatus
  startGame: () => void
  recordAnswer: (correct: boolean, points?: number) => void
  completeGame: () => Promise<GameResult>
  resetGame: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameSession({ gameSlug, letterId }: GameSessionOptions): UseGameSessionReturn {
  const { user } = useAuth()

  const [score, setScore]                     = useState(0)
  const [questionsTotal, setQuestionsTotal]   = useState(0)
  const [questionsCorrect, setQuestionsCorrect] = useState(0)
  const [startTime, setStartTime]             = useState<Date | null>(null)
  const [status, setStatus]                   = useState<SessionStatus>('idle')

  // Accumulated refs — avoid stale closure issues in completeGame
  const scoreRef            = useRef(0)
  const totalRef            = useRef(0)
  const correctRef          = useRef(0)
  const startTimeRef        = useRef<Date | null>(null)

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const startGame = useCallback(() => {
    const now = new Date()
    scoreRef.current   = 0
    totalRef.current   = 0
    correctRef.current = 0
    startTimeRef.current = now

    setScore(0)
    setQuestionsTotal(0)
    setQuestionsCorrect(0)
    setStartTime(now)
    setStatus('playing')
  }, [])

  const recordAnswer = useCallback((correct: boolean, points = 10) => {
    totalRef.current   += 1
    if (correct) {
      correctRef.current += 1
      scoreRef.current   += points
    }

    setQuestionsTotal(totalRef.current)
    setQuestionsCorrect(correctRef.current)
    setScore(scoreRef.current)
  }, [])

  const completeGame = useCallback(async (): Promise<GameResult> => {
    setStatus('completed')

    const now          = new Date()
    const start        = startTimeRef.current ?? now
    const durationSecs = Math.round((now.getTime() - start.getTime()) / 1000)
    const accuracy     = calculateAccuracy(correctRef.current, totalRef.current)
    const stars        = getStarsFromAccuracy(accuracy)
    const passed       = stars > 0

    const result: GameResult = {
      score:             scoreRef.current,
      questionsTotal:    totalRef.current,
      questionsCorrect:  correctRef.current,
      accuracy,
      durationSeconds:   durationSecs,
      stars,
      passed,
    }

    // Persist to Supabase when user is authenticated
    if (user) {
      const { error } = await supabase.from('game_sessions').insert({
        student_id:        user.id,
        game_slug:         gameSlug,
        letter_id:         letterId ?? null,
        started_at:        start.toISOString(),
        completed_at:      now.toISOString(),
        score:             result.score,
        questions_total:   result.questionsTotal,
        questions_correct: result.questionsCorrect,
        accuracy:          result.accuracy,
        duration_seconds:  result.durationSeconds,
        status:            'completed',
      } as any)

      if (error) {
        console.error('[useGameSession] Failed to save session:', error.message)
      }
    }

    return result
  }, [user, gameSlug, letterId])

  const resetGame = useCallback(() => {
    scoreRef.current   = 0
    totalRef.current   = 0
    correctRef.current = 0
    startTimeRef.current = null

    setScore(0)
    setQuestionsTotal(0)
    setQuestionsCorrect(0)
    setStartTime(null)
    setStatus('idle')
  }, [])

  return {
    score,
    questionsTotal,
    questionsCorrect,
    startTime,
    status,
    startGame,
    recordAnswer,
    completeGame,
    resetGame,
  }
}
