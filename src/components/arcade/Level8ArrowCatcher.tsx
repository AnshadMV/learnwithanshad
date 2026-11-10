import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Lightbulb, Volume2, Clock } from 'lucide-react'
import { generateLevel1MoleWaves, type MoleOption } from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

const COLUMNS = 5

export default function Level8ArrowCatcher({
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
  const { playCoin, playCorrect, playWrong, playClick, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const waves = useMemo(
    () => generateLevel1MoleWaves(letterId, difficulty, letterMode, waveSeconds, 10),
    [letterId, difficulty, letterMode, waveSeconds, restartSeq]
  )

  const [waveIdx, setWaveIdx] = useState(0)
  const [basketCol, setBasketCol] = useState(2)
  const [dropY, setDropY] = useState(6) // 6 -> 84%
  const [hintActive, setHintActive] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null)

  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentWave = waves[waveIdx] || waves[0]

  // Assign falling stars strictly across 5 columns so target is always catchable
  const starColumns = useMemo(() => {
    const targetOpt = currentWave.moles.find(m => m.isTarget) || currentWave.moles[0]
    const distOpts = currentWave.moles.filter(m => m.id !== targetOpt.id)
    const targetCol = (waveIdx * 2 + 1) % COLUMNS
    const cols: MoleOption[] = []
    let di = 0
    for (let c = 0; c < COLUMNS; c++) {
      if (c === targetCol) cols.push(targetOpt)
      else cols.push(distOpts[di++] || targetOpt)
    }
    return { cols, targetCol }
  }, [currentWave, waveIdx])

  useEffect(() => {
    setWaveIdx(0)
    setBasketCol(2)
    setDropY(6)
    setHintActive(false)
    setFeedback(null)
    lockRef.current = false
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
    if (bonusTimeSeq > 0) setDropY(y => Math.max(5, y - 35))
  }, [bonusTimeSeq, bonusTimeSec])

  const advanceWave = useCallback(() => {
    if (completedRef.current) return
    if (waveIdx < waves.length - 1) {
      lockRef.current = false
      setWaveIdx(w => w + 1)
      setDropY(6)
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

  const timeLeftEst = Math.max(0, Math.round(((84 - dropY) / 78) * (currentWave?.durationSeconds || 10)))

  useEffect(() => {
    onTelemetry({ wave: waveIdx + 1, totalWaves: waves.length, timeLeft: timeLeftEst })
  }, [waveIdx, waves.length, timeLeftEst])

  const resolveCatch = useCallback(
    (col: number) => {
      if (lockRef.current || completedRef.current) return
      lockRef.current = true
      totalRef.current += 1
      const item = starColumns.cols[col]
      if (item?.isTarget) {
        correctRef.current += 1
        playCoin()
        playCorrect()
        speak(item.char)
        onAnswer(true, 20)
        setFeedback({ text: `Caught ${item.char}! ⭐`, good: true })
      } else {
        playWrong()
        onAnswer(false, 0)
        setFeedback({ text: `Missed! Catch ${currentWave.targetChar}`, good: false })
      }
      setTimeout(advanceWave, 600)
    },
    [starColumns, currentWave?.targetChar, playCoin, playCorrect, playWrong, speak, onAnswer, advanceWave]
  )

  // Falling star drop timer
  useEffect(() => {
    if (isPaused || completedRef.current) return
    const speed = currentWave.difficulty === 'hard' ? 1.15 : currentWave.difficulty === 'medium' ? 0.95 : 0.78
    const iv = setInterval(() => {
      if (lockRef.current) return
      setDropY(prev => {
        const next = prev + speed
        if (next >= 84) {
          resolveCatch(basketCol)
          return 84
        }
        return next
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, waveIdx, basketCol, currentWave.difficulty, resolveCatch])

  const moveBasket = useCallback(
    (delta: number) => {
      if (isPaused || lockRef.current || completedRef.current) return
      playClick()
      setBasketCol(c => Math.max(0, Math.min(COLUMNS - 1, c + delta)))
    },
    [isPaused, playClick]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault()
        moveBasket(-1)
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault()
        moveBasket(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moveBasket])

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400 bg-gradient-to-b from-indigo-950 via-blue-900 to-amber-900 text-white p-4 sm:p-5 space-y-4 select-none">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-arabic text-3xl font-black flex items-center justify-center shadow" dir="rtl">
            {currentWave.targetChar}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
              Level 8 • Star Drop {waveIdx + 1}/{waves.length}
            </span>
            <h3 className="font-black text-sm sm:text-base mt-0.5">
              Slide Basket with ◀ / ▶ to Catch <span className="text-amber-300">{currentWave.targetLabel}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/40 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-300" /> {timeLeftEst}s
          </div>
          <button type="button" onClick={() => speak(currentWave.targetChar)} className="p-2 rounded-xl bg-white/15">
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setHintActive(true)
              playStar()
            }}
            className="p-2 rounded-xl bg-amber-400/20 text-amber-300"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Falling Star Field (5 Columns) */}
      <div className="relative h-72 sm:h-80 rounded-2xl bg-slate-950/60 border-2 border-amber-300/30 grid grid-cols-5 overflow-hidden">
        {starColumns.cols.map((opt, colIdx) => {
          const isBasketHere = basketCol === colIdx
          const isHintCol = hintActive && colIdx === starColumns.targetCol

          return (
            <div
              key={colIdx}
              onClick={() => setBasketCol(colIdx)}
              className={cn(
                'relative border-r last:border-r-0 border-white/10 h-full cursor-pointer transition-colors',
                isBasketHere && 'bg-amber-400/10',
                isHintCol && 'bg-amber-300/15'
              )}
            >
              {/* Falling Star Token */}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-all',
                  isHintCol
                    ? 'bg-amber-300 border-white text-slate-950 ring-2 ring-amber-200'
                    : 'bg-white text-slate-900 border-amber-400'
                )}
                style={{ top: `${dropY}%` }}
              >
                <span className="font-arabic text-2xl sm:text-3xl font-black" dir="rtl">
                  {opt.char}
                </span>
              </div>

              {/* Golden Catcher Basket at Bottom */}
              {isBasketHere && (
                <motion.div
                  layoutId="star-catcher-basket"
                  transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[88%] h-10 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-white flex items-center justify-center text-xl shadow-xl"
                >
                  🧺
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

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

      {/* Left / Catch Now / Right Arrow Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => moveBasket(-1)}
          disabled={basketCol === 0}
          className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-black flex items-center gap-2 shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" /> Move Left
        </button>

        <button
          type="button"
          onClick={() => resolveCatch(basketCol)}
          className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-lg active:scale-95"
        >
          Catch! 🧺
        </button>

        <button
          type="button"
          onClick={() => moveBasket(1)}
          disabled={basketCol === COLUMNS - 1}
          className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 font-black flex items-center gap-2 shadow-lg active:scale-95"
        >
          Move Right <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
