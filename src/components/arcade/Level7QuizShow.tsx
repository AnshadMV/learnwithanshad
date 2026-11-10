import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Volume2, Clock, Sparkles, Scissors } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  generateLevel7QuizQuestions,
  resolveWaveDifficulty,
} from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn } from '@/lib/utils'

export default function Level7QuizShow({
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

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]
  const resolvedDiff = resolveWaveDifficulty(difficulty, 5, 10)

  const questions = useMemo(
    () => generateLevel7QuizQuestions(letterObj.id, resolvedDiff, 8),
    [letterObj.id, resolvedDiff, restartSeq]
  )

  const [qIdx, setQIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(waveSeconds)
  const [selectedOptId, setSelectedOptId] = useState<string | null>(null)
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([])
  const [used5050, setUsed5050] = useState(false)
  const [usedExtraTime, setUsedExtraTime] = useState(false)
  const [hintActive, setHintActive] = useState(false)

  const lockRef = useRef(false)
  const completedRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  const currentQ = questions[qIdx] || questions[0]

  useEffect(() => {
    setQIdx(0)
    setTimeLeft(waveSeconds)
    setSelectedOptId(null)
    setEliminatedIds([])
    setUsed5050(false)
    setUsedExtraTime(false)
    setHintActive(false)
    lockRef.current = false
    completedRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [questions, waveSeconds])

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
    if (qIdx < questions.length - 1) {
      lockRef.current = false
      setQIdx(q => q + 1)
      setTimeLeft(waveSeconds)
      setSelectedOptId(null)
      setEliminatedIds([])
      setHintActive(false)
    } else {
      completedRef.current = true
      onComplete({ correct: correctRef.current, total: Math.max(totalRef.current, questions.length) })
    }
  }, [qIdx, questions.length, waveSeconds, onComplete])

  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) advance()
  }, [nextWaveSeq, advance])

  useEffect(() => {
    onTelemetry({ wave: qIdx + 1, totalWaves: questions.length, timeLeft: Math.ceil(timeLeft) })
  }, [qIdx, questions.length, Math.ceil(timeLeft)])

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
  }, [isPaused, qIdx, advance])

  const handleChoose = (optId: string, isCorrect: boolean, char: string) => {
    if (isPaused || lockRef.current || completedRef.current) return
    lockRef.current = true
    totalRef.current += 1
    setSelectedOptId(optId)
    speak(char)

    if (isCorrect) {
      correctRef.current += 1
      playCorrect()
      onAnswer(true, 20 + Math.round(timeLeft))
    } else {
      playWrong()
      onAnswer(false, 0)
    }
    setTimeout(advance, 950)
  }

  const handle5050 = () => {
    if (used5050 || lockRef.current) return
    playClick()
    const wrongOpts = currentQ.options.filter(o => !o.isCorrect).slice(0, 2)
    setEliminatedIds(wrongOpts.map(w => w.id))
    setUsed5050(true)
  }

  const handleExtraTime = () => {
    if (usedExtraTime || lockRef.current) return
    playStar()
    setTimeLeft(t => t + 5)
    setUsedExtraTime(true)
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-violet-500 bg-gradient-to-br from-[#1E1046] via-[#2D1469] to-[#11092B] text-white p-4 sm:p-6 space-y-5 select-none">
      {/* Stage Top Spotlight Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/10 backdrop-blur rounded-2xl p-3.5 border border-violet-400/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-arabic text-3xl font-black flex items-center justify-center shadow" dir="rtl">
            {currentQ.arabicDisplay || letterObj.letter}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase bg-violet-500/40 text-violet-200 px-2.5 py-0.5 rounded-full">
              Level 7 • Question {qIdx + 1}/{questions.length}
            </span>
            <h3 className="font-black text-base text-amber-200 mt-0.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" /> Game Show Quiz Blitz
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lifelines */}
          <button
            type="button"
            disabled={used5050}
            onClick={handle5050}
            className="px-2.5 py-1.5 rounded-xl bg-purple-600/60 hover:bg-purple-500 disabled:opacity-35 border border-purple-300/40 text-xs font-black flex items-center gap-1"
            title="Eliminate 2 wrong options"
          >
            <Scissors className="w-3.5 h-3.5" /> 50/50
          </button>
          <button
            type="button"
            disabled={usedExtraTime}
            onClick={handleExtraTime}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-600/60 hover:bg-cyan-500 disabled:opacity-35 border border-cyan-300/40 text-xs font-black"
          >
            +5s
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 font-mono font-black text-sm border border-violet-400/30">
            <Clock className="w-4 h-4 text-amber-300" />
            <span className={timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-white'}>
              {timeLeft.toFixed(1)}s
            </span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/15 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg sm:text-xl font-black text-white">{currentQ.prompt}</h2>
          <button
            type="button"
            onClick={() => speak(letterObj.letter)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25"
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

      {/* 4 Buzzer Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {currentQ.options.map((opt, idx) => {
          const isElim = eliminatedIds.includes(opt.id)
          const isChosen = selectedOptId === opt.id
          const showResult = selectedOptId !== null
          const isHinted = hintActive && opt.isCorrect && !showResult

          return (
            <motion.button
              key={opt.id}
              type="button"
              disabled={isElim || showResult}
              whileHover={isElim || showResult ? undefined : { scale: 1.02 }}
              whileTap={isElim || showResult ? undefined : { scale: 0.97 }}
              onClick={() => handleChoose(opt.id, opt.isCorrect, opt.char)}
              className={cn(
                'p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all text-left',
                isElim
                  ? 'opacity-20 bg-slate-900 border-slate-800'
                  : showResult && opt.isCorrect
                  ? 'bg-emerald-500 border-emerald-200 text-white shadow-xl'
                  : isChosen && !opt.isCorrect
                  ? 'bg-rose-600 border-rose-200 text-white'
                  : isHinted
                  ? 'bg-amber-400/30 border-amber-300 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-900/80 hover:bg-violet-800/80 border-violet-400/40'
              )}
            >
              <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-black text-sm shrink-0">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-arabic text-3xl sm:text-4xl font-black flex-1 text-center" dir="rtl">
                {opt.char}
              </span>
              <span className="text-xs font-bold text-violet-200 shrink-0 max-w-[100px] truncate">
                {opt.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {selectedOptId && (
        <div className="p-3 rounded-xl bg-white/15 text-center text-xs sm:text-sm font-bold text-amber-200">
          {currentQ.explanation}
        </div>
      )}
    </div>
  )
}
