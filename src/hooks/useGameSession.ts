import { useCallback, useRef, useState, useEffect } from 'react'
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
// Live Broadcast Helper
// ---------------------------------------------------------------------------

let liveChannel: ReturnType<typeof supabase.channel> | null = null

function getLiveChannel() {
  if (!liveChannel) {
    liveChannel = supabase.channel('classroom_live_share', {
      config: { broadcast: { self: false } },
    })
    liveChannel.subscribe()
  }
  return liveChannel
}

function broadcastLiveActivity(payload: Record<string, any>) {
  try {
    const ch = getLiveChannel()
    ch.send({
      type: 'broadcast',
      event: 'student_activity',
      payload,
    }).catch(() => {})
  } catch {}
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameSession({ gameSlug, letterId }: GameSessionOptions): UseGameSessionReturn {
  const { user, profile } = useAuth()

  const [score, setScore] = useState(0)
  const [questionsTotal, setQuestionsTotal] = useState(0)
  const [questionsCorrect, setQuestionsCorrect] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [status, setStatus] = useState<SessionStatus>('idle')

  const scoreRef = useRef(0)
  const totalRef = useRef(0)
  const correctRef = useRef(0)
  const startTimeRef = useRef<Date | null>(null)

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const startGame = useCallback(() => {
    const now = new Date()
    scoreRef.current = 0
    totalRef.current = 0
    correctRef.current = 0
    startTimeRef.current = now

    setScore(0)
    setQuestionsTotal(0)
    setQuestionsCorrect(0)
    setStartTime(now)
    setStatus('playing')

    // Broadcast session start to Live Monitor
    broadcastLiveActivity({
      student_id: user?.id || 'guest_student',
      display_name: profile?.display_name || 'Little Explorer',
      game_slug: gameSlug,
      letter_id: letterId ?? null,
      score: 0,
      questions_completed: 0,
      accuracy: 100,
      status: 'playing',
      timestamp: now.toISOString(),
    })
  }, [user?.id, profile?.display_name, gameSlug, letterId])

  const recordAnswer = useCallback(
    (correct: boolean, points = 10) => {
      totalRef.current += 1
      if (correct) {
        correctRef.current += 1
        scoreRef.current += points
      }

      setQuestionsTotal(totalRef.current)
      setQuestionsCorrect(correctRef.current)
      setScore(scoreRef.current)

      const acc = calculateAccuracy(correctRef.current, totalRef.current)

      // Broadcast live event on each answer
      broadcastLiveActivity({
        student_id: user?.id || 'guest_student',
        display_name: profile?.display_name || 'Little Explorer',
        game_slug: gameSlug,
        letter_id: letterId ?? null,
        score: scoreRef.current,
        questions_completed: correctRef.current,
        accuracy: acc,
        status: 'playing',
        timestamp: new Date().toISOString(),
      })
    },
    [user?.id, profile?.display_name, gameSlug, letterId]
  )

  const completeGame = useCallback(async (): Promise<GameResult> => {
    setStatus('completed')

    const now = new Date()
    const start = startTimeRef.current ?? now
    const durationSecs = Math.round((now.getTime() - start.getTime()) / 1000)
    const accuracy = calculateAccuracy(correctRef.current, totalRef.current)
    const stars = getStarsFromAccuracy(accuracy)
    const passed = stars > 0

    const result: GameResult = {
      score: scoreRef.current,
      questionsTotal: totalRef.current,
      questionsCorrect: correctRef.current,
      accuracy,
      durationSeconds: durationSecs,
      stars,
      passed,
    }

    // Broadcast live completion event
    broadcastLiveActivity({
      student_id: user?.id || 'guest_student',
      display_name: profile?.display_name || 'Little Explorer',
      game_slug: gameSlug,
      letter_id: letterId ?? null,
      score: result.score,
      questions_completed: result.questionsCorrect,
      accuracy: result.accuracy,
      status: 'completed',
      timestamp: now.toISOString(),
    })

    // Persist to Supabase when user is authenticated (if table exists)
    if (user) {
      try {
        await supabase.from('game_sessions').insert({
          student_id: user.id,
          game_slug: gameSlug,
          letter_id: letterId ?? null,
          started_at: start.toISOString(),
          completed_at: now.toISOString(),
          score: result.score,
          questions_total: result.questionsTotal,
          questions_correct: result.questionsCorrect,
          accuracy: result.accuracy,
          duration_seconds: result.durationSeconds,
          status: 'completed',
        } as any)

        if (letterId) {
          await supabase.from('student_letter_progress').upsert({
            student_id: user.id,
            letter_id: letterId,
            mastery_level: stars * 33,
            attempts: result.questionsTotal,
            correct: result.questionsCorrect,
            completed: passed,
            last_practiced_at: now.toISOString(),
          } as any)
        }
      } catch (err) {
        console.warn('Game persistence warning:', err)
      }
    }

    return result
  }, [user, gameSlug, letterId])

  const resetGame = useCallback(() => {
    scoreRef.current = 0
    totalRef.current = 0
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
