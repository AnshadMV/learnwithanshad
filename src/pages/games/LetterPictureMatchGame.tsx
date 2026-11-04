import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { getLetterVariants } from '@/data/letterVariants'
import { getConfusableDistractors } from '@/data/letterPedagogy'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function LetterPictureMatchGame() {
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
    gameSlug: 'letter-picture-match',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetWord, setTargetWord] = useState(LETTER_EXAMPLES[0])
  const [letterOptions, setLetterOptions] = useState<{ id: string; label: string; isCorrect: boolean }[]>([])
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  // Filter words: if letter scoped, take examples for this letter!
  const availableExamples = useMemo(() => {
    if (paramLetter) {
      const filtered = LETTER_EXAMPLES.filter(ex => ex.letter_id === paramLetter)
      return filtered.length > 0 ? filtered : LETTER_EXAMPLES.slice(0, 10)
    }
    return LETTER_EXAMPLES.filter(ex => ex.letter_position === 'beginning')
  }, [paramLetter])

  const startRound = (idx: number) => {
    const word = availableExamples[idx % availableExamples.length]
    setTargetWord(word)

    if (paramLetter) {
      // LETTER-SPECIFIC:
      // Options can test identifying the target letter among confusable lookalikes, or matching the harakah
      const variants = getLetterVariants(paramLetter)
      const correctChar = targetLetterObj?.letter || 'ا'

      const confusableIds = getConfusableDistractors(paramLetter, 3)
      const confusableLetters = confusableIds.map(id => getLetterById(id)?.letter).filter(Boolean) as string[]
      const fillerLetters = ARABIC_LETTERS.filter(l => l.id !== paramLetter).slice(0, 3).map(l => l.letter)

      const distractors = confusableLetters.length >= 2 ? confusableLetters.slice(0, 3) : fillerLetters

      const options = shuffleArray([
        { id: 'correct', label: correctChar, isCorrect: true },
        ...distractors.map((d, i) => ({ id: `dist_${i}`, label: d, isCorrect: false })),
      ])
      setLetterOptions(options)
    } else {
      const correctLetter = ARABIC_LETTERS.find(l => l.id === word.letter_id)?.letter || 'ب'
      const otherLetters = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== word.letter_id),
        3
      ).map(l => l.letter)

      const options = shuffleArray([
        { id: 'correct', label: correctLetter, isCorrect: true },
        ...otherLetters.map((l, i) => ({ id: `dist_${i}`, label: l, isCorrect: false })),
      ])
      setLetterOptions(options)
    }

    setSelectedLetter(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (opt: { id: string; label: string; isCorrect: boolean }) => {
    if (selectedLetter !== null) return
    setSelectedLetter(opt.label)

    speak(opt.label)

    if (opt.isCorrect) {
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="letter-picture-match" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl shadow-sm">
            🎯
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Picture & Letter Match
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Vocabulary ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Explore lovely illustrated words that contain letter <strong>{targetLetterObj.name_english}</strong> and match with the correct letter!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Look at the picture and Arabic word, then tap the letter that matches it!
              </p>
            )}
          </div>
          <Button variant="success" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Matching! 🎨
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Picture Card */}
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-emerald-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>

            <div className="text-7xl sm:text-8xl animate-bounce-gentle select-none">
              {targetWord.emoji}
            </div>

            <div>
              <div className="flex items-center justify-center gap-3">
                <ArabicText size="3xl" weight="bold" className="text-gray-800">
                  {targetWord.arabic_word}
                </ArabicText>
                <button
                  onClick={() => speak(targetWord.arabic_word)}
                  className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  title="Hear word"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-500 mt-1 capitalize">
                {targetWord.english_meaning} ({targetWord.transliteration})
              </p>
              {targetWord.child_explanation && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  "{targetWord.child_explanation}"
                </p>
              )}
            </div>
          </div>

          {/* Letter Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {letterOptions.map((opt, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedLetter === opt.label
              let btnStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                btnStyle = opt.isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 ring-4 ring-emerald-300 shadow-xl'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[120px] sm:min-h-[140px] flex items-center justify-center shadow-card transition-all cursor-pointer ${btnStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-5xl sm:text-6xl font-black ${isSelected ? 'text-white' : theme.text}`}
                  >
                    {opt.label}
                  </ArabicText>
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
