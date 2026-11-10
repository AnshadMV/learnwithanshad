import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Lightbulb, Clock } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { generateWordHunterRounds } from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

export default function Level9WordHunter({
  letterId,
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
  const { playCorrect, playWrong, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]
  const rounds = useMemo(() => generateWordHunterRounds(letterObj.id, 8), [letterObj.id, restartSeq])

  const initialSec = Math.max(12, waveSeconds)
  const [idx, setIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(initialSec)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [hintActive, setHintActive] = useState(false)

  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const current = rounds[idx] || rounds[0]

  useEffect(() => {
    setIdx(0)
    setTimeLeft(Math.max(12, waveSeconds))
    setChosenId(null)
    setHintActive(false)
    lockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [rounds, waveSeconds])

  useEffect(() => {
    if (current?.example?.arabic_word) speak(current.example.arabic_word)
  }, [idx, current?.example?.arabic_word])

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
    if (idx < rounds.length - 1) {
      lockRef.current = false
      setIdx(i => i + 1)
      setTimeLeft(Math.max(12, waveSeconds))
      setChosenId(null)
      setHintActive(false)
    } else {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, rounds.length) })
    }
  }, [idx, rounds.length, waveSeconds, onComplete])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advance()
  }, [nextWaveSeq, advance])

  useEffect(() => {
    onTelemetry({ wave: idx + 1, totalWaves: rounds.length, timeLeft: Math.ceil(timeLeft) })
  }, [idx, rounds.length, Math.ceil(timeLeft)])

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
            setTimeout(advance, 850)
          }
          return 0
        }
        return Number((t - 0.1).toFixed(1))
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPaused, idx, advance])

  const handleSelect = (optId: string, isCorrect: boolean) => {
    if (isPaused || lockRef.current || completedRef.current) return
    lockRef.current = true
    totalRef.current += 1
    setChosenId(optId)

    if (isCorrect) {
      correctRef.current += 1
      playCorrect()
      speak(current.example.arabic_word)
      onAnswer(true, 25)
    } else {
      playWrong()
      onAnswer(false, 0)
    }
    setTimeout(advance, 950)
  }

  return (
    <div className="rounded-3xl shadow-2xl border-4 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-4 sm:p-6 space-y-5 select-none">
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Level 9 • Word {idx + 1}/{rounds.length}
          </span>
          <h3 className="font-black text-slate-800 text-base mt-1">
            Forge the Missing <span className="text-emerald-700">{current.formLabel}</span> Form of {letterObj.name_english}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 font-mono font-black text-sm">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className={timeLeft <= 3 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
          <button
            type="button"
            onClick={() => speak(current.example.arabic_word)}
            className="p-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
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

      {/* Illustrated Arabic Vocabulary Card */}
      <div className="bg-white rounded-3xl p-6 text-center shadow-lg border-2 border-emerald-200 space-y-3">
        <div className="text-6xl">{current.example.emoji}</div>
        <div className="text-sm font-bold text-slate-500">
          "{current.example.english_meaning}" ({current.example.transliteration})
        </div>
        <div className="font-arabic text-5xl sm:text-6xl font-black text-slate-900 py-2" dir="rtl">
          {chosenId ? current.example.arabic_word : current.maskedWord}
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-extrabold border border-teal-200">
          Position Needed: {current.formLabel}
        </span>
      </div>

      {/* Form Choices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {current.options.map(opt => {
          const showResult = chosenId !== null
          const isPicked = chosenId === opt.id
          const isHinted = hintActive && opt.isCorrect && !showResult

          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={showResult}
              whileHover={showResult ? undefined : { scale: 1.04 }}
              whileTap={showResult ? undefined : { scale: 0.96 }}
              onClick={() => handleSelect(opt.id, opt.isCorrect)}
              className={cn(
                'p-4 rounded-2xl border-3 flex flex-col items-center justify-center gap-1 transition-all shadow-sm bg-white',
                showResult && opt.isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg'
                  : isPicked && !opt.isCorrect
                  ? 'bg-rose-500 text-white border-rose-600'
                  : isHinted
                  ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-300 animate-pulse'
                  : 'border-emerald-200 hover:border-emerald-500 text-slate-900'
              )}
            >
              <span className="font-arabic text-4xl font-black leading-none" dir="rtl">
                {opt.char}
              </span>
              <span className={cn('text-[10px] font-bold', showResult && (opt.isCorrect || isPicked) ? 'text-white/90' : 'text-slate-500')}>
                {opt.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
