import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { ArcadeDifficulty, ArcadeLetterMode } from '@/data/arcadeLevels'

export interface ArcadeTeacherDirective {
  letterId?: string
  level?: number
  difficulty?: ArcadeDifficulty
  letterMode?: ArcadeLetterMode
  waveSeconds?: number
  paused?: boolean
  lockToLevel?: number | null
  strictSequential?: boolean
  unlockAll?: boolean
  hintSeq?: number
  restartSeq?: number
  nextWaveSeq?: number
  bonusTimeSec?: number
  bonusTimeSeq?: number
  autoNavigate?: boolean
  commandSource?: string
  updatedAt?: string
}

export interface ArcadeLiveTelemetry {
  student_id: string
  display_name: string
  gameSlug: string
  letterId: string
  level: number
  levelTitle: string
  wave: number
  totalWaves: number
  timeLeft: number
  difficulty: ArcadeDifficulty
  letterMode: ArcadeLetterMode
  score: number
  accuracy: number
  lives?: number
  paused?: boolean
  lockedLevel?: number | null
  strictSequential?: boolean
  status: 'playing' | 'paused' | 'completed' | 'map'
  updatedAt: string
}

const ROOM_DIRECTIVE_KEY = (roomCode: string) => `arabic_arcade_room_directive_${roomCode}`
const STUDENT_DIRECTIVE_KEY = (studentId: string) => `arabic_arcade_student_directive_${studentId}`

export function getSavedRoomDirective(roomCode: string): ArcadeTeacherDirective | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ROOM_DIRECTIVE_KEY(roomCode))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getSavedStudentDirective(studentId: string): ArcadeTeacherDirective | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STUDENT_DIRECTIVE_KEY(studentId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function buildArcadeUrl(cmd: ArcadeTeacherDirective): string {
  const params = new URLSearchParams()
  if (cmd.letterId) params.set('letter', cmd.letterId)
  if (cmd.level) params.set('level', String(cmd.level))
  if (cmd.difficulty) params.set('difficulty', cmd.difficulty)
  if (cmd.letterMode) params.set('mode', cmd.letterMode)
  if (cmd.waveSeconds) params.set('seconds', String(cmd.waveSeconds))
  const qs = params.toString()
  return `/games/letter-arcade${qs ? `?${qs}` : ''}`
}

/**
 * Teacher sends direct Arcade control command to a single student device
 */
export async function sendArcadeStudentCommand(
  studentId: string,
  command: ArcadeTeacherDirective
): Promise<void> {
  const payload = {
    type: 'arcade_control',
    targetStudentId: studentId,
    ...command,
    url: command.autoNavigate ? buildArcadeUrl(command) : undefined,
    teacherName: 'Ustadh Anshad',
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
  }

  try {
    const existing = getSavedStudentDirective(studentId) || {}
    localStorage.setItem(STUDENT_DIRECTIVE_KEY(studentId), JSON.stringify({ ...existing, ...command, updatedAt: payload.updatedAt }))
  } catch {}

  try {
    const channel = supabase.channel(`student_screen_${studentId}`, {
      config: { broadcast: { self: true } },
    })
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel
          .send({
            type: 'broadcast',
            event: 'teacher_remote_control',
            payload,
          })
          .catch(() => {})
          .finally(() => {
            setTimeout(() => supabase.removeChannel(channel), 800)
          })
      }
    })
  } catch {}

  try {
    const shared = supabase.channel('classroom_live_share', {
      config: { broadcast: { self: true } },
    })
    shared.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        shared
          .send({
            type: 'broadcast',
            event: 'arcade_classroom_directive',
            payload,
          })
          .catch(() => {})
          .finally(() => {
            setTimeout(() => supabase.removeChannel(shared), 800)
          })
      }
    })
  } catch {}
}

/**
 * Teacher sends classroom-wide Arcade command (applies to all students in room)
 */
export async function sendArcadeClassroomCommand(
  roomCode: string,
  command: ArcadeTeacherDirective
): Promise<void> {
  const normalizedRoom = (roomCode || 'LEVEL-1').toUpperCase()
  const payload = {
    type: 'arcade_control',
    roomCode: normalizedRoom,
    ...command,
    url: command.autoNavigate ? buildArcadeUrl(command) : undefined,
    teacherName: 'Ustadh Anshad',
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
  }

  try {
    const existing = getSavedRoomDirective(normalizedRoom) || {}
    localStorage.setItem(
      ROOM_DIRECTIVE_KEY(normalizedRoom),
      JSON.stringify({ ...existing, ...command, updatedAt: payload.updatedAt })
    )
    window.dispatchEvent(new CustomEvent('arabic-arcade-remote-command', { detail: payload }))
  } catch {}

  try {
    const ch = supabase.channel(`arcade_classroom_control_${normalizedRoom}`, {
      config: { broadcast: { self: true } },
    })
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        ch.send({
          type: 'broadcast',
          event: 'arcade_classroom_directive',
          payload,
        })
          .catch(() => {})
          .finally(() => {
            setTimeout(() => supabase.removeChannel(ch), 800)
          })
      }
    })

    const shared = supabase.channel('classroom_live_share', {
      config: { broadcast: { self: true } },
    })
    shared.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        shared
          .send({
            type: 'broadcast',
            event: 'arcade_classroom_directive',
            payload,
          })
          .catch(() => {})
          .finally(() => {
            setTimeout(() => supabase.removeChannel(shared), 800)
          })
      }
    })
  } catch {}
}

let sharedTelemetryChannel: ReturnType<typeof supabase.channel> | null = null

function getSharedTelemetryChannel() {
  if (!sharedTelemetryChannel) {
    sharedTelemetryChannel = supabase.channel('classroom_live_share', {
      config: { broadcast: { self: false } },
    })
    sharedTelemetryChannel.subscribe()
  }
  return sharedTelemetryChannel
}

/**
 * Broadcasts live Arcade game telemetry so Teacher Live Monitor and Live Screen Watcher show level/wave/timer/difficulty
 */
export function broadcastArcadeTelemetry(telemetry: ArcadeLiveTelemetry): void {
  try {
    const prev = (window as any).__ARABIC_ACTIVE_GAME__ || {}
    ;(window as any).__ARABIC_ACTIVE_GAME__ = {
      ...prev,
      gameSlug: telemetry.gameSlug || 'letter-arcade',
      letterId: telemetry.letterId,
      score: telemetry.score,
      accuracy: telemetry.accuracy,
      status: telemetry.status === 'map' ? 'playing' : telemetry.status,
      level: telemetry.level,
      levelName: telemetry.levelTitle,
      wave: telemetry.wave,
      totalWaves: telemetry.totalWaves,
      timeLeft: telemetry.timeLeft,
      difficulty: telemetry.difficulty,
      letterMode: telemetry.letterMode,
      lives: telemetry.lives,
      paused: telemetry.paused,
      lockedLevel: telemetry.lockedLevel ?? null,
      strictSequential: telemetry.strictSequential ?? false,
    }
  } catch {}

  try {
    const ch = getSharedTelemetryChannel()
    if ((ch as any)?.state === 'joined') {
      ch.send({
        type: 'broadcast',
        event: 'arcade_telemetry',
        payload: telemetry,
      }).catch(() => {})
    }
  } catch {}
}

/**
 * Student-side hook listening for real-time Teacher Arcade Directives
 */
export function useStudentArcadeRemoteControl(
  onDirective: (cmd: ArcadeTeacherDirective) => void,
  roomCode?: string | null,
  studentId?: string | null
) {
  const callbackRef = useRef(onDirective)
  callbackRef.current = onDirective

  useEffect(() => {
    const normalizedRoom = (roomCode || (typeof window !== 'undefined' ? localStorage.getItem('arabic_student_room') : '') || 'LEVEL-1').toUpperCase()

    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail
      if (!detail) return
      if (detail.targetStudentId && studentId && detail.targetStudentId !== studentId) return
      callbackRef.current(detail)
    }

    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return
      if (
        e.key === ROOM_DIRECTIVE_KEY(normalizedRoom) ||
        (studentId && e.key === STUDENT_DIRECTIVE_KEY(studentId))
      ) {
        try {
          const parsed = JSON.parse(e.newValue)
          callbackRef.current(parsed)
        } catch {}
      }
    }

    window.addEventListener('arabic-arcade-remote-command', handleCustomEvent)
    window.addEventListener('storage', handleStorage)

    const roomChannel = supabase
      .channel(`arcade_classroom_control_${normalizedRoom}`, {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: 'arcade_classroom_directive' }, ({ payload }) => {
        if (!payload) return
        if (payload.targetStudentId && studentId && payload.targetStudentId !== studentId) return
        callbackRef.current(payload)
      })
      .subscribe()

    const liveChannel = supabase
      .channel('classroom_live_share', {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: 'arcade_classroom_directive' }, ({ payload }) => {
        if (!payload) return
        if (payload.roomCode && payload.roomCode !== normalizedRoom) return
        if (payload.targetStudentId && studentId && payload.targetStudentId !== studentId) return
        callbackRef.current(payload)
      })
      .subscribe()

    return () => {
      window.removeEventListener('arabic-arcade-remote-command', handleCustomEvent)
      window.removeEventListener('storage', handleStorage)
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(liveChannel)
    }
  }, [roomCode, studentId])
}
