import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Lightbulb, Volume2, Clock } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getConfusableDistractors } from '@/data/letterPedagogy'
import { getLetterVariants } from '@/data/letterVariants'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn, pickRandom, shuffleArray } from '@/lib/utils'

interface CrateItem {
  id: string
  char: string
  label: string
  belongsToTarget: boolean
}

export default function Level6ConveyorSorter({
  letterId,
  difficulty,
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
  const { playCorrect, playWrong, playStar, playClick } = useSound()
  const { speak } = useArabicSpeech()

  const target = getLetterById(letterId) || ARABIC_LETTERS[0]

  const crates = useMemo<CrateItem[]>(() => {
    const variants = getLetterVariants(target.id).slice(0, 7)
    const confusableIds = getConfusableDistractors(target.id, 4)
    const others = [
      ...confusableIds.map(id => getLetterById(id)).filter(Boolean),
      ...pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== target.id && !confusableIds.includes(l.id)),
        4
      ),
    ]

    const list: CrateItem[] = []
    for (let i = 0; i < 5; i++) {
      const v = variants[i % variants.length]
      list.push({
        id: `crate_t_${i}`,
        char: difficulty === 'simple' && i < 2 ? target.letter : v.char,
        label: v.name,
        belongsToTarget: true,
      })
    }
    for (let i = 0; i < 5; i++) {
      const d = others[i % others.length]!
      list.push({
        id: `crate_o_${i}`,
        char: difficulty === 'hard' ? d.forms.initial : d.letter,
        label: d.name_english,
        belongsToTarget: false,
      })
    }
    return shuffleArray(list)
  }, [target, difficulty, restartSeq])

  const [idx, setIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(waveSeconds)
  const [hintActive, setHintActive] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null)

  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentCrate = crates[idx] || crates[0]

  useEffect(() => {
    setIdx(0)
    setTimeLeft(waveSeconds)
    setHintActive(false)
    setFeedback(null)
    lockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [crates, waveSeconds])

  useEffect(() => {
    if (currentCrate) speak(currentCrate.char)
  }, [idx, currentCrate?.char])

  useEffect(() => {
    if (hintSeq > 0) {
      setHintActive(true)
      playStar()
    }
  }, [hintSeq, playStar])

  useEffect(() => {
    if (bonusTimeSeq > 0) setTimeLeft(t => t + (bonusTimeSec || 5))
  }, [bonusTimeSeq, bonusTimeSec])

  const advance = useCallback(() => {
    if (completedRef.current) return
    if (idx < crates.length - 1) {
      lockRef.current = false
      setIdx(i => i + 1)
      setTimeLeft(waveSeconds)
      setHintActive(false)
      setFeedback(null)
    } else {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, crates.length) })
    }
  }, [idx, crates.length, waveSeconds, onComplete])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advance()
  }, [nextWaveSeq, advance])

  useEffect(() => {
    onTelemetry({ wave: idx + 1, totalWaves: crates.length, timeLeft: Math.ceil(timeLeft) })
  }, [idx, crates.length, Math.ceil(timeLeft)])

  useEffect(() => {
    if (isPaused || completedRef.current) return
    const iv = setInterval(() => {
      if (lockRef.current) return
      setTimeLeft(t => {
        if (t <= 0.2) {
          if (!lockRef.current) {
            lockRef.current = true
            totalRef.current += 1
            playWrong()
            onAnswer(false, 0)
            setFeedback({ text: `Crate fell off the belt!`, good: false })
            setTimeout(advance, 550)
          }
          return 0
        }
        return Number((t - 0.1).toFixed(1))
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, idx, advance])

  const handleSort = useCallback(
    (chooseTargetGate: boolean) => {
      if (isPaused || lockRef.current || completedRef.current) return
      lockRef.current = true
      totalRef.current += 1
      playClick()

      const isRight = chooseTargetGate === currentCrate.belongsToTarget
      if (isRight) {
        correctRef.current += 1
        playCorrect()
        onAnswer(true, 18)
        setFeedback({
          text: `Sorted! "${currentCrate.label}" ✓`,
          good: true,
        })
      } else {
        playWrong()
        onAnswer(false, 0)
        setFeedback({
          text: `Oops! "${currentCrate.label}" goes ${currentCrate.belongsToTarget ? 'Left ◀' : 'Right ▶'}`,
          good: false,
        })
      }
      setTimeout(advance, 600)
    },
    [isPaused, currentCrate, playClick, playCorrect, playWrong, onAnswer, advance]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault()
        handleSort(true)
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault()
        handleSort(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSort])

  return (
    <div className="rounded-3xl shadow-2xl border-4 border-cyan-500 bg-gradient-to-b from-slate-900 to-cyan-950 text-white p-4 sm:p-6 space-y-5 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/10 rounded-2xl p-3.5 border border-white/15">
        <div>
          <span className="text-[10px] font-black uppercase bg-cyan-400/20 text-cyan-200 px-2.5 py-0.5 rounded-full">
            Level 6 • Crate {idx + 1}/{crates.length}
          </span>
          <h3 className="font-black text-base mt-1">
            Sort Crates: Does this belong to{' '}
            <span className="font-arabic text-2xl text-amber-300" dir="rtl">
              {target.letter}
            </span>{' '}
            ({target.name_english})?
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 font-mono font-black text-sm">
            <Clock className="w-4 h-4 text-cyan-300" />
            <span className={timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-white'}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <button
            type="button"
            onClick={() => speak(currentCrate.char)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
          >
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

      {/* Moving Conveyor Crate */}
      <div className="bg-slate-800/80 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[210px]">
        <div className="w-40 h-2 rounded-full bg-slate-700 mb-4" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCrate.id}
            initial={{ y: -35, scale: 0.85, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-40 h-40 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 border-4 border-amber-100 shadow-2xl flex flex-col items-center justify-center text-slate-950"
          >
            <span className="text-xs font-black uppercase text-amber-900">📦 Incoming</span>
            <span className="font-arabic text-6xl font-black leading-none my-1" dir="rtl">
              {currentCrate.char}
            </span>
            <span className="text-[11px] font-bold text-amber-950">{currentCrate.label}</span>
          </motion.div>
        </AnimatePresence>

        {feedback && (
          <div
            className={cn(
              'mt-3 px-4 py-1 rounded-full text-xs font-black',
              feedback.good ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            )}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Left / Right Gate Arrow Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleSort(true)}
          className={cn(
            'p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-300 font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all',
            hintActive && currentCrate.belongsToTarget && 'ring-4 ring-amber-300 animate-pulse'
          )}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>
            YES: {target.letter} & Types
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSort(false)}
          className={cn(
            'p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 border-2 border-rose-300 font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all',
            hintActive && !currentCrate.belongsToTarget && 'ring-4 ring-amber-300 animate-pulse'
          )}
        >
          <span>OTHER Letter</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
