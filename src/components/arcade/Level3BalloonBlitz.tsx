import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Lightbulb, Clock } from 'lucide-react'
import { generateLevel1MoleWaves, type MoleOption } from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

const BALLOON_COLORS = [
  'from-sky-400 to-blue-600 border-sky-200',
  'from-rose-400 to-pink-600 border-rose-200',
  'from-emerald-400 to-green-600 border-emerald-200',
  'from-amber-400 to-orange-500 border-amber-200',
  'from-violet-400 to-purple-600 border-violet-200',
  'from-cyan-400 to-teal-600 border-cyan-200',
  'from-fuchsia-400 to-pink-600 border-fuchsia-200',
  'from-indigo-400 to-blue-600 border-indigo-200',
]

export default function Level3BalloonBlitz({
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
  const { playPop, playCorrect, playWrong, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const waves = useMemo(
    () => generateLevel1MoleWaves(letterId, difficulty, letterMode, waveSeconds, 10),
    [letterId, difficulty, letterMode, waveSeconds, restartSeq]
  )

  const [waveIdx, setWaveIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(waveSeconds)
  const [poppedIds, setPoppedIds] = useState<Record<string, 'good' | 'bad'>>({})
  const [hintActive, setHintActive] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null)

  const waveLockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentWave = waves[waveIdx] || waves[0]

  useEffect(() => {
    setWaveIdx(0)
    setTimeLeft(waves[0]?.durationSeconds || waveSeconds)
    setPoppedIds({})
    setHintActive(false)
    setFeedback(null)
    waveLockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [waves, waveSeconds])

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
      setTimeLeft(t => t + (bonusTimeSec || 5))
    }
  }, [bonusTimeSeq, bonusTimeSec])

  const advanceWave = () => {
    if (completedRef.current) return
    if (waveIdx < waves.length - 1) {
      const next = waveIdx + 1
      waveLockRef.current = false
      setWaveIdx(next)
      setTimeLeft(waves[next]?.durationSeconds || waveSeconds)
      setPoppedIds({})
      setHintActive(false)
      setFeedback(null)
    } else {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, waves.length) })
    }
  }

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advanceWave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextWaveSeq])

  useEffect(() => {
    onTelemetry({ wave: waveIdx + 1, totalWaves: waves.length, timeLeft: Math.ceil(timeLeft) })
  }, [waveIdx, waves.length, Math.ceil(timeLeft)])

  useEffect(() => {
    if (isPaused || completedRef.current) return
    const iv = setInterval(() => {
      if (waveLockRef.current) return
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          if (!waveLockRef.current) {
            waveLockRef.current = true
            totalRef.current += 1
            playWrong()
            onAnswer(false, 0)
            setFeedback({ text: `Balloons floated away! Target: ${currentWave.targetChar}`, good: false })
            setTimeout(advanceWave, 600)
          }
          return 0
        }
        return Math.max(0, Number((prev - 0.1).toFixed(1)))
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, waveIdx, currentWave?.targetChar])

  const handlePop = (opt: MoleOption) => {
    if (isPaused || waveLockRef.current || poppedIds[opt.id]) return
    totalRef.current += 1
    if (opt.isTarget) {
      waveLockRef.current = true
      correctRef.current += 1
      playPop()
      playCorrect()
      speak(opt.char)
      const pts = 15 + Math.round(timeLeft * 2)
      onAnswer(true, pts)
      setPoppedIds(p => ({ ...p, [opt.id]: 'good' }))
      setFeedback({ text: `POP! +${pts} pts (${opt.label}) 🎈`, good: true })
      setTimeout(advanceWave, 600)
    } else {
      playWrong()
      onAnswer(false, 0)
      setPoppedIds(p => ({ ...p, [opt.id]: 'bad' }))
      setFeedback({ text: `Wrong balloon! Pop ${currentWave.targetChar}!`, good: false })
    }
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-sky-400 bg-gradient-to-b from-sky-400 via-sky-200 to-blue-100 p-4 sm:p-6 min-h-[520px] flex flex-col justify-between select-none relative">
      {/* Header Prompt */}
      <div className="bg-white/95 backdrop-blur rounded-2xl p-3.5 shadow-lg border-2 border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => speak(currentWave.targetChar)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-arabic text-4xl font-black flex items-center justify-center shadow"
            dir="rtl"
          >
            {currentWave.targetChar}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                Level 3 • Wave {currentWave.waveNumber}/{waves.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                {currentWave.difficulty}
              </span>
            </div>
            <h3 className="font-black text-slate-800 text-base mt-0.5">
              Pop Balloon: <span className="text-brand-blue">{currentWave.targetLabel}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-black text-sm">
            <Clock className="w-4 h-4 text-sky-600" />
            <span className={timeLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <button
            type="button"
            onClick={() => speak(currentWave.targetChar)}
            className="p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setHintActive(true)
              playStar()
            }}
            className="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback */}
      <div className="min-h-[28px] flex justify-center my-2">
        {feedback && (
          <div
            className={cn(
              'px-4 py-1 rounded-full text-xs font-black shadow',
              feedback.good ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            )}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Floating Balloons Arena */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 items-center justify-items-center py-4 flex-1">
        <AnimatePresence>
          {currentWave.moles.map((opt, idx) => {
            const popped = poppedIds[opt.id]
            const showHint = hintActive && opt.isTarget
            const grad = BALLOON_COLORS[idx % BALLOON_COLORS.length]

            if (popped === 'bad') {
              return (
                <div key={opt.id} className="h-32 flex items-center justify-center opacity-30 text-xs font-bold text-slate-600">
                  💨 Missed
                </div>
              )
            }

            return (
              <motion.button
                key={`${waveIdx}_${opt.id}`}
                type="button"
                animate={{
                  y: [0, idx % 2 === 0 ? -12 : 10, 0],
                  scale: popped === 'good' ? 1.35 : 1,
                  opacity: popped === 'good' ? 0 : 1,
                }}
                transition={{
                  y: { repeat: Infinity, duration: 2.2 + (idx % 3) * 0.4, ease: 'easeInOut' },
                  scale: { duration: 0.25 },
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePop(opt)}
                className="flex flex-col items-center focus:outline-none group"
              >
                <div
                  className={cn(
                    'w-24 h-28 sm:w-28 sm:h-32 rounded-[50%_50%_46%_46%] bg-gradient-to-br border-4 shadow-xl flex flex-col items-center justify-center relative transition-all',
                    grad,
                    showHint && 'ring-4 ring-yellow-300 animate-pulse'
                  )}
                >
                  {/* Gloss highlight */}
                  <div className="w-4 h-8 rounded-full bg-white/35 absolute top-3 left-4 rotate-[-20deg]" />
                  <span className="font-arabic text-4xl sm:text-5xl font-black text-white drop-shadow" dir="rtl">
                    {opt.char}
                  </span>
                  {currentWave.difficulty !== 'simple' && (
                    <span className="text-[9px] font-bold text-white/90 mt-0.5 truncate max-w-[76px]">
                      {opt.label}
                    </span>
                  )}
                  {showHint && (
                    <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-yellow-300 text-slate-950 text-[10px] font-black shadow">
                      💡 POP!
                    </span>
                  )}
                </div>
                {/* Knot + String */}
                <div className="w-3 h-2 bg-white/80 rounded-b-sm -mt-0.5" />
                <div className="w-0.5 h-8 bg-slate-600/40" />
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="text-center text-xs font-bold text-sky-900 bg-white/60 rounded-xl py-1.5 px-3">
        Tap the balloon carrying <strong>{currentWave.targetLabel}</strong> before 10s runs out!
      </div>
    </div>
  )
}
