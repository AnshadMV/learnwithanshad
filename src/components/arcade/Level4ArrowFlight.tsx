import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Volume2, Lightbulb, Zap } from 'lucide-react'
import { generateLevel1MoleWaves, type MoleOption } from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

const LANE_COUNT = 4

export default function Level4ArrowFlight({
  letterId,
  difficulty,
  letterMode,
  waveSeconds,
  isPaused,
  hintSeq,
  restartSeq,
  nextWaveSeq,
  bonusTimeSeq,
  bonusTimeSec,
  onAnswer,
  onTelemetry,
  onComplete,
}: ArcadeLevelProps) {
  const { playCoin, playCorrect, playWrong, playClick, playStar, playWhoosh } = useSound()
  const { speak } = useArabicSpeech()

  const waves = useMemo(
    () => generateLevel1MoleWaves(letterId, difficulty, letterMode, Math.max(8, waveSeconds), 8),
    [letterId, difficulty, letterMode, waveSeconds, restartSeq]
  )

  const [waveIdx, setWaveIdx] = useState(0)
  const [planeLane, setPlaneLane] = useState(1)
  const [cloudX, setCloudX] = useState(88) // Moves 88 -> 12 across lanes
  const [hintActive, setHintActive] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null)

  const waveLockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentWave = waves[waveIdx] || waves[0]

  // Map wave options strictly into 4 lanes (ensuring target is always present in a lane!)
  const laneOptions = useMemo(() => {
    const targetOpt = currentWave.moles.find(m => m.isTarget) || currentWave.moles[0]
    const distOpts = currentWave.moles.filter(m => m.id !== targetOpt.id).slice(0, 3)
    const targetLane = (waveIdx * 3 + 1) % LANE_COUNT
    const arr: MoleOption[] = []
    let di = 0
    for (let lane = 0; lane < LANE_COUNT; lane++) {
      if (lane === targetLane) {
        arr.push(targetOpt)
      } else {
        arr.push(distOpts[di++] || targetOpt)
      }
    }
    return { arr, targetLane }
  }, [currentWave, waveIdx])

  useEffect(() => {
    setWaveIdx(0)
    setPlaneLane(1)
    setCloudX(88)
    setHintActive(false)
    setFeedback(null)
    waveLockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [waves])

  useEffect(() => {
    if (currentWave?.targetChar) speak(currentWave.targetChar)
  }, [waveIdx, currentWave?.targetChar])

  useEffect(() => {
    if (hintSeq > 0) {
      setHintActive(true)
      playStar()
    }
  }, [hintSeq, playStar])

  useEffect(() => {
    if (bonusTimeSeq > 0) {
      setCloudX(x => Math.min(92, x + 28))
    }
  }, [bonusTimeSeq, bonusTimeSec])

  const advanceWave = useCallback(() => {
    if (completedRef.current) return
    if (waveIdx < waves.length - 1) {
      waveLockRef.current = false
      setWaveIdx(w => w + 1)
      setCloudX(88)
      setHintActive(false)
      setFeedback(null)
    } else {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, waves.length) })
    }
  }, [waveIdx, waves.length, onComplete])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advanceWave()
  }, [nextWaveSeq, advanceWave])

  const estimatedSecLeft = Math.max(0, Math.round(((cloudX - 14) / 74) * (currentWave?.durationSeconds || 10)))

  useEffect(() => {
    onTelemetry({ wave: waveIdx + 1, totalWaves: waves.length, timeLeft: estimatedSecLeft })
  }, [waveIdx, waves.length, estimatedSecLeft])

  const resolvePlaneCollision = useCallback(
    (chosenLane: number) => {
      if (waveLockRef.current || completedRef.current) return
      waveLockRef.current = true
      totalRef.current += 1
      const hitOpt = laneOptions.arr[chosenLane]
      if (hitOpt?.isTarget) {
        correctRef.current += 1
        playCoin()
        playCorrect()
        speak(hitOpt.char)
        onAnswer(true, 20)
        setFeedback({ text: `Direct Hit! Flew through ${hitOpt.char}! ✈️`, good: true })
      } else {
        playWrong()
        onAnswer(false, 0)
        setFeedback({ text: `Storm cloud (${hitOpt?.char})! Aim for ${currentWave.targetChar}`, good: false })
      }
      setTimeout(advanceWave, 650)
    },
    [laneOptions, currentWave?.targetChar, playCoin, playCorrect, playWrong, speak, onAnswer, advanceWave]
  )

  // Approach loop
  useEffect(() => {
    if (isPaused || completedRef.current) return
    const stepPer100ms = 74 / ((currentWave?.durationSeconds || 10) * 10)
    const iv = setInterval(() => {
      if (waveLockRef.current) return
      setCloudX(prev => {
        const next = prev - stepPer100ms
        if (next <= 16) {
          resolvePlaneCollision(planeLane)
          return 16
        }
        return next
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, waveIdx, planeLane, currentWave?.durationSeconds, resolvePlaneCollision])

  const moveLane = useCallback(
    (delta: number) => {
      if (isPaused || waveLockRef.current || completedRef.current) return
      playClick()
      setPlaneLane(l => Math.max(0, Math.min(LANE_COUNT - 1, l + delta)))
    },
    [isPaused, playClick]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        moveLane(-1)
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault()
        moveLane(1)
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        playWhoosh()
        resolvePlaneCollision(planeLane)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveLane, planeLane, playWhoosh, resolvePlaneCollision])

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-teal-400 bg-gradient-to-b from-cyan-500 via-sky-300 to-cyan-100 p-4 sm:p-5 select-none space-y-4">
      {/* Header Prompt */}
      <div className="bg-white/95 rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-arabic text-3xl font-black flex items-center justify-center" dir="rtl">
            {currentWave.targetChar}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              Level 4 • Flight {waveIdx + 1}/{waves.length}
            </span>
            <h3 className="font-black text-slate-800 text-sm sm:text-base">
              Steer Plane with ▲/▼ Arrows to <span className="text-teal-700">{currentWave.targetLabel}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => speak(currentWave.targetChar)}
            className="p-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setHintActive(true)
              playStar()
            }}
            className="p-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Cloud Lanes Stage */}
      <div className="relative bg-gradient-to-r from-sky-700/80 via-cyan-600/75 to-blue-700/80 rounded-2xl p-3 border-2 border-white/50 space-y-2.5 overflow-hidden">
        {laneOptions.arr.map((opt, laneIdx) => {
          const isPlaneHere = planeLane === laneIdx
          const isHintLane = hintActive && laneIdx === laneOptions.targetLane

          return (
            <div
              key={laneIdx}
              onClick={() => setPlaneLane(laneIdx)}
              className={cn(
                'relative h-20 rounded-xl border-2 flex items-center px-3 cursor-pointer transition-all',
                isPlaneHere
                  ? 'bg-white/25 border-yellow-300 shadow-inner'
                  : 'bg-white/10 border-white/20 hover:bg-white/15',
                isHintLane && 'ring-2 ring-amber-300'
              )}
            >
              {/* Lane Dashed Cloud Line */}
              <div className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-white/25 pointer-events-none" />

              {/* Plane Sprite */}
              {isPlaneHere && (
                <motion.div
                  layoutId="sky-flyer-plane"
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="z-20 flex items-center gap-1 bg-white text-slate-900 px-2.5 py-1 rounded-2xl shadow-lg border-2 border-yellow-400"
                  style={{ marginLeft: '4%' }}
                >
                  <span className="text-2xl sm:text-3xl">✈️</span>
                </motion.div>
              )}

              {/* Approaching Arabic Letter Cloud */}
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full border-2 shadow-lg flex items-center gap-2 transition-all z-10',
                  isHintLane
                    ? 'bg-amber-300 border-white text-slate-950 animate-pulse'
                    : 'bg-white border-sky-200 text-slate-900'
                )}
                style={{ left: `${cloudX}%`, transform: 'translate(-50%, -50%)' }}
              >
                <span className="font-arabic text-2xl sm:text-3xl font-black leading-none" dir="rtl">
                  {opt.char}
                </span>
                {isHintLane && <span className="text-[10px] font-black">💡</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={cn(
            'text-center text-xs font-black py-1.5 px-4 rounded-xl',
            feedback.good ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          )}
        >
          {feedback.text}
        </div>
      )}

      {/* Touch Arrow Controls + Boost Button */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => moveLane(-1)}
          disabled={planeLane === 0}
          className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black flex items-center gap-2 shadow-lg active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
          <span>Fly Up</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playWhoosh()
            resolvePlaneCollision(planeLane)
          }}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black flex items-center gap-2 shadow-lg active:scale-95"
        >
          <Zap className="w-5 h-5" />
          <span>Boost & Collect ▶</span>
        </button>

        <button
          type="button"
          onClick={() => moveLane(1)}
          disabled={planeLane === LANE_COUNT - 1}
          className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black flex items-center gap-2 shadow-lg active:scale-95"
        >
          <ArrowDown className="w-5 h-5" />
          <span>Fly Down</span>
        </button>
      </div>
    </div>
  )
}
