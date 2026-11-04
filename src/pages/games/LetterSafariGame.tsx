import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, ArrowLeft, RotateCcw, Trophy, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { getConfusableDistractors } from '@/data/letterPedagogy'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function LetterSafariGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const { playCorrect, playWrong, playClick } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, questionsTotal, questionsCorrect, recordAnswer, completeGame, startGame } =
    useGameSession({
      gameSlug: 'letter-safari',
      letterId: paramLetter || undefined,
    })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ARABIC_LETTERS[0])
  const [options, setOptions] = useState<LetterData[]>([])
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [isCorrectFeedback, setIsCorrectFeedback] = useState<boolean | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = paramLetter ? 5 : 8

  const startNewRound = (roundIdx: number) => {
    const target = paramLetter
      ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[0]
      : ARABIC_LETTERS[roundIdx % ARABIC_LETTERS.length]
    setTargetLetter(target)

    // For distractors, use confusable lookalikes when letter is scoped
    const confusableIds = getConfusableDistractors(target.id, 6)
    const confusableLetters = confusableIds
      .map(id => ARABIC_LETTERS.find(l => l.id === id)!)
      .filter(Boolean)

    const otherLetters = ARABIC_LETTERS.filter(
      l => l.id !== target.id && !confusableIds.includes(l.id)
    )
    const fillerDistractors = pickRandom(otherLetters, 8 - confusableLetters.length)
    const distractors = [...confusableLetters, ...fillerDistractors].slice(0, 8)

    const combined = shuffleArray([target, ...distractors])
    setOptions(combined)
    setSelectedLetter(null)
    setIsCorrectFeedback(null)
  }

  const handleStartGame = () => {
    startGame()
    setCurrentRound(0)
    startNewRound(0)
    setGameState('playing')
  }

  const handleSelect = async (letter: LetterData) => {
    if (selectedLetter !== null) return // debounce

    setSelectedLetter(letter.id)
    const isCorrect = letter.id === targetLetter.id

    if (isCorrect) {
      playCorrect()
      celebrate()
      setIsCorrectFeedback(true)
      recordAnswer(true, 10)
    } else {
      playWrong()
      setIsCorrectFeedback(false)
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        const gameRes = await completeGame()
        setResult(gameRes)
        setGameState('completed')
      } else {
        const nextRound = currentRound + 1
        setCurrentRound(nextRound)
        startNewRound(nextRound)
      }
    }, 1100)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase">Score:</span>
          <span className="text-lg font-black text-brand-blue">{score}</span>
        </div>
      </div>

      {/* Letter-Specific Mode Banner */}
      {paramLetter && (
        <div className="flex items-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <span>🎯</span>
          <span>Safari Focused on Letter: <span className="font-arabic text-lg ml-1" dir="rtl">{targetLetter.letter}</span> ({targetLetter.name_english})</span>
        </div>
      )}

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            🔍
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">Letter Safari</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Look closely at the 9 letters and spot the requested safari letter!
            </p>
          </div>
          <Button variant="primary" onClick={handleStartGame} className="px-8 py-3.5 text-base">
            Start Safari Hunt! 🚀
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Target Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center space-y-3 border-4 border-blue-200">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS} • Find this letter:
            </span>
            <div className="flex items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-3xl bg-brand-blue text-white flex items-center justify-center shadow-lg">
                <ArabicText size="3xl" weight="bold" className="text-white">
                  {targetLetter.letter}
                </ArabicText>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-black text-gray-800">{targetLetter.name_english}</h3>
                <span className="text-xs text-gray-500 font-arabic" dir="rtl">
                  {targetLetter.name_arabic}
                </span>
                <button
                  onClick={() => speak(targetLetter.letter)}
                  className="mt-1 flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Hear sound
                </button>
              </div>
            </div>
          </div>

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {options.map((letter, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedLetter === letter.id
              const isTarget = letter.id === targetLetter.id

              let cardBg = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                cardBg = isTarget
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 shadow-xl ring-4 ring-emerald-300'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={`${letter.id}-${idx}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(letter)}
                  className={`p-6 sm:p-8 rounded-3xl border-4 text-center transition-all flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] shadow-sm ${cardBg}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-5xl sm:text-6xl font-black ${isSelected ? 'text-white' : theme.text}`}
                  >
                    {letter.letter}
                  </ArabicText>
                  <span
                    className={`text-xs font-black mt-2 ${
                      isSelected ? 'text-white/90' : 'text-gray-700'
                    }`}
                  >
                    {letter.name_english}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStartGame}
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
