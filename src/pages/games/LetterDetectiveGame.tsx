import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterVariants, LetterVariant } from '@/data/letterVariants'
import { getConfusableDistractors } from '@/data/letterPedagogy'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

export default function LetterDetectiveGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playClick } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-detective',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetChar, setTargetChar] = useState('ب')
  const [targetVariantName, setTargetVariantName] = useState('Letter Ba')
  const [streamLetters, setStreamLetters] = useState<string[]>([])
  const [actualCount, setActualCount] = useState(2)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const variants: LetterVariant[] = useMemo(() => {
    if (paramLetter) {
      return getLetterVariants(paramLetter)
    }
    return []
  }, [paramLetter])

  const startRound = (idx: number) => {
    let target = 'ب'
    let vName = 'Ba'

    if (paramLetter && variants.length > 0) {
      // LETTER-SPECIFIC: Every round asks about the target letter and its specific types / harakat!
      const currentVar = variants[idx % variants.length]
      target = currentVar.char
      vName = currentVar.name

      // For distractors, use confusable lookalikes or other letters
      const confusableIds = getConfusableDistractors(paramLetter, 4)
      const distractorLetters = confusableIds.length >= 2
        ? confusableIds.map(id => getLetterById(id)?.letter).filter(Boolean) as string[]
        : ARABIC_LETTERS.filter(l => l.id !== paramLetter).slice(0, 4).map(l => l.letter)

      // Random occurrences between 1 and 4
      const count = Math.floor(Math.random() * 3) + 1
      setActualCount(count)

      const pool: string[] = []
      for (let i = 0; i < count; i++) pool.push(target)
      for (let i = 0; i < 7 - count; i++) {
        pool.push(distractorLetters[i % distractorLetters.length])
      }

      setStreamLetters(shuffleArray(pool))
    } else {
      // General Alphabet Mode
      const l = ARABIC_LETTERS[idx % ARABIC_LETTERS.length]
      target = l.letter
      vName = l.name_english

      const others = pickRandom(
        ARABIC_LETTERS.filter(item => item.letter !== target),
        3
      ).map(item => item.letter)

      const count = Math.floor(Math.random() * 3) + 1
      setActualCount(count)

      const pool: string[] = []
      for (let i = 0; i < count; i++) pool.push(target)
      for (let i = 0; i < 7 - count; i++) {
        pool.push(others[i % others.length])
      }

      setStreamLetters(shuffleArray(pool))
    }

    setTargetChar(target)
    setTargetVariantName(vName)
    setSelectedAnswer(null)
    setTimeout(() => speak(target), 200)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handlePickCount = async (num: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(num)

    const isCorrect = num === actualCount
    if (isCorrect) {
      playCorrect()
      celebrate()
      recordAnswer(true, 15)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        const next = currentRound + 1
        setCurrentRound(next)
        startRound(next)
      }
    }, 1100)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{paramLetter ? 'Back to Letter' : 'Arcade Home'}</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {/* Letter Scope Banner */}
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="letter-detective" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            🔎
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Detective
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Detective ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Every round is focused on letter <strong>{targetLetterObj.name_english}</strong> and its various vowel marks & shapes! Count how many times it appears in each clue line.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Scan the row of Arabic letters carefully and count how many times the target letter appears!
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Detective Scan! 🔍
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Target Question Box */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-purple-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-3">
              <span className="text-lg font-bold text-gray-700">How many times do you see:</span>
              <div className="flex items-center gap-2">
                <span className="min-w-14 px-3 h-14 rounded-2xl bg-brand-blue text-white font-arabic font-bold text-3xl flex items-center justify-center shadow">
                  {targetChar}
                </span>
                <button
                  onClick={() => speak(targetChar)}
                  className="p-2.5 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  title="Hear sound"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs font-bold text-purple-600 mt-2">
              {targetVariantName}
            </p>
          </div>

          {/* Letter Stream Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card flex items-center justify-center gap-2 sm:gap-4 border-2 border-gray-100 overflow-x-auto">
            {streamLetters.map((l, i) => (
              <span
                key={i}
                className="w-14 h-16 sm:w-20 sm:h-22 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center font-arabic text-4xl sm:text-5xl font-black text-gray-800 shadow-sm select-none transition-transform hover:scale-105"
              >
                {l}
              </span>
            ))}
          </div>

          {/* Number Options with Distinct Kid Themes */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((num, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedAnswer === num
              const isRight = num === actualCount

              let btnStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} ${theme.text} shadow-md`
              if (isSelected) {
                btnStyle = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 ring-4 ring-emerald-300 shadow-xl'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePickCount(num)}
                  className={`p-6 sm:p-8 rounded-3xl border-4 text-center font-black text-4xl sm:text-5xl shadow-card transition-all cursor-pointer min-h-[90px] sm:min-h-[110px] flex items-center justify-center ${btnStyle}`}
                >
                  {num}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStart}
          onHome={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
        />
      )}
    </div>
  )
}
