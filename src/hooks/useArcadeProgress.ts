import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface ArcadeLevelRecord {
  level: number // 1..10
  completed: boolean
  stars: number // 0..3
  bestScore: number
  bestAccuracy: number
  attempts: number
  lastPlayedAt: string
}

export type LetterArcadeLevelsMap = Record<number, ArcadeLevelRecord>
export type LetterArcadeProgressMap = Record<string, LetterArcadeLevelsMap>

export interface LetterArcadeSummary {
  levels: LetterArcadeLevelsMap
  completedCount: number
  totalStars: number
  maxStars: number
  nextRecommendedLevel: number
}

function getStudentStorageKey(userId?: string | null): string {
  if (userId) return `arabic_arcade_progress_${userId}`
  if (typeof window !== 'undefined') {
    const devId = localStorage.getItem('arabic_device_student_id') || 'guest_student'
    return `arabic_arcade_progress_${devId}`
  }
  return 'arabic_arcade_progress_guest_student'
}

export function loadArcadeProgressMap(userId?: string | null): LetterArcadeProgressMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(getStudentStorageKey(userId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveArcadeProgressMap(map: LetterArcadeProgressMap, userId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getStudentStorageKey(userId), JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('arabic-arcade-progress-updated'))
  } catch {}
}

export function computeLetterSummary(levelsMap: LetterArcadeLevelsMap | undefined): LetterArcadeSummary {
  const levels = levelsMap || {}
  let completedCount = 0
  let totalStars = 0
  let highestCompleted = 0

  for (let lvl = 1; lvl <= 10; lvl++) {
    const rec = levels[lvl]
    if (rec?.completed) {
      completedCount += 1
      highestCompleted = lvl
    }
    if (rec?.stars) {
      totalStars += rec.stars
    }
  }

  let nextRecommendedLevel = 1
  for (let lvl = 1; lvl <= 10; lvl++) {
    if (!levels[lvl]?.completed) {
      nextRecommendedLevel = lvl
      break
    }
    if (lvl === 10 && levels[10]?.completed) {
      nextRecommendedLevel = 10
    }
  }

  if (completedCount > 0 && nextRecommendedLevel < highestCompleted) {
    // Keep sequential recommendation when gaps exist
  }

  return {
    levels,
    completedCount,
    totalStars,
    maxStars: 30,
    nextRecommendedLevel,
  }
}

export function useArcadeProgress() {
  const { user } = useAuth()
  const userId = user?.id || null

  const [progressMap, setProgressMap] = useState<LetterArcadeProgressMap>(() =>
    loadArcadeProgressMap(userId)
  )

  useEffect(() => {
    setProgressMap(loadArcadeProgressMap(userId))
  }, [userId])

  useEffect(() => {
    const handleSync = () => setProgressMap(loadArcadeProgressMap(userId))
    window.addEventListener('arabic-arcade-progress-updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('arabic-arcade-progress-updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [userId])

  const getLetterProgress = useCallback(
    (letterId: string): LetterArcadeSummary => {
      return computeLetterSummary(progressMap[letterId])
    },
    [progressMap]
  )

  const recordLevelCompletion = useCallback(
    async (
      letterId: string,
      level: number,
      score: number,
      accuracy: number,
      stars: number,
      passed: boolean = stars > 0
    ) => {
      const now = new Date().toISOString()
      setProgressMap(prev => {
        const existingLetter = prev[letterId] || {}
        const existingRec = existingLetter[level]
        const nextRec: ArcadeLevelRecord = {
          level,
          completed: Boolean(existingRec?.completed || passed),
          stars: Math.max(existingRec?.stars || 0, stars),
          bestScore: Math.max(existingRec?.bestScore || 0, score),
          bestAccuracy: Math.max(existingRec?.bestAccuracy || 0, accuracy),
          attempts: (existingRec?.attempts || 0) + 1,
          lastPlayedAt: now,
        }

        const updated: LetterArcadeProgressMap = {
          ...prev,
          [letterId]: {
            ...existingLetter,
            [level]: nextRec,
          },
        }
        saveArcadeProgressMap(updated, userId)
        return updated
      })

      if (userId) {
        try {
          await supabase.from('student_activity_events').insert({
            student_id: userId,
            event_type: 'arcade_level_completed',
            game_slug: 'letter-arcade',
            letter_id: letterId,
            metadata: { level, score, accuracy, stars, passed },
          } as any)
        } catch {}
      }
    },
    [userId]
  )

  const isLevelLocked = useCallback(
    (
      letterId: string,
      level: number,
      options?: { strictSequential?: boolean; lockToLevel?: number | null }
    ): boolean => {
      if (options?.lockToLevel && options.lockToLevel !== level) {
        return true
      }
      if (options?.strictSequential && level > 1) {
        const prevCompleted = Boolean(progressMap[letterId]?.[level - 1]?.completed)
        return !prevCompleted
      }
      return false
    },
    [progressMap]
  )

  const getTotalArcadeStats = useCallback(() => {
    let totalStars = 0
    let totalCompletedLevels = 0
    let masteredLettersCount = 0

    Object.values(progressMap).forEach(levels => {
      let letterCompleted = 0
      for (let lvl = 1; lvl <= 10; lvl++) {
        const rec = levels?.[lvl]
        if (rec?.completed) {
          totalCompletedLevels += 1
          letterCompleted += 1
        }
        if (rec?.stars) totalStars += rec.stars
      }
      if (letterCompleted === 10) masteredLettersCount += 1
    })

    return { totalStars, totalCompletedLevels, masteredLettersCount }
  }, [progressMap])

  return {
    progressMap,
    getLetterProgress,
    recordLevelCompletion,
    isLevelLocked,
    getTotalArcadeStats,
  }
}
