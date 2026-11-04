import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterOddRounds, OddLetterRound } from '@/data/letterVariants'
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

export default function FindDifferentLetterGame() {
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
    gameSlug: 'find-different',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [cards, setCards] = useState<{ id: string; letter: string; name?: string; isOdd: boolean; explanation?: string }[]>([])
  const [roundPrompt, setRoundPrompt] = useState<{ title: string; subtitle: string }>({
    title: 'Spot the Odd Letter Out! 🕵️',
    subtitle: 'Look closely and tap the ONE letter that is different!',
  })
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  // Pre-generate letter-specific rounds if scoped
  const letterRounds: OddLetterRound[] = useMemo(() => {
    if (paramLetter) {
      return getLetterOddRounds(paramLetter, TOTAL_ROUNDS)
    }
    return []
  }, [paramLetter])

  const startRound = (roundIdx: number) => {
    if (paramLetter && letterRounds.length > roundIdx) {
      const r = letterRounds[roundIdx]
      setRoundPrompt({
        title: r.title,
        subtitle: r.subtitle,
      })
      setCards(r.cards)
    } else {
      // General Alphabet Odd Out
      const [common, odd] = pickRandom(ARABIC_LETTERS, 2)
      const list = [
        { id: '1', letter: common.letter, name: common.name_english, isOdd: false },
        { id: '2', letter: common.letter, name: common.name_english, isOdd: false },
        { id: '3', letter: common.letter, name: common.name_english, isOdd: false },
        { id: '4', letter: common.letter, name: common.name_english, isOdd: false },
        { id: '5', letter: odd.letter, name: odd.name_english, isOdd: true },
      ]
      setRoundPrompt({
        title: 'Spot the Odd Letter Out! 🕵️',
        subtitle: `Four are identical twins! Tap the ONE letter that is different from the rest.`,
      })
      setCards(shuffleArray(list))
    }
    setSelectedIdx(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleCardClick = async (idx: number, card: { isOdd: boolean; letter: string; explanation?: string }) => {
    if (selectedIdx !== null) return
    setSelectedIdx(idx)

    // Speak clicked character
    speak(card.letter)

    if (card.isOdd) {
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
    }, 1200)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{paramLetter ? `Back to Letter` : `Arcade Home`}</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {/* Letter Scope Banner */}
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="find-different" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sunny-100 text-sunny-600 flex items-center justify-center text-4xl shadow-sm">
            🕵️
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Find the Different Letter
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Edition ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Practice recognizing forms, harakat vowels (fathah, kasrah, dammah), and spot foreign intruder letters!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Four letters are identical twins! Tap the ONE letter that is different from the rest.
              </p>
            )}
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Detective Mission! 🔍
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Question / Mission Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-sunny-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase text-gray-400 mb-1">
              <span>Round {currentRound + 1} of {TOTAL_ROUNDS}</span>
              {targetLetterObj && (
                <span className="text-brand-blue font-bold">
                  Letter: {targetLetterObj.name_english}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
              {roundPrompt.title}
            </h2>
            <p className="text-sm font-semibold text-gray-600 mt-2 max-w-md mx-auto">
              {roundPrompt.subtitle}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {cards.map((card, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedIdx === idx
              let cardStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                cardStyle = card.isOdd
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 shadow-xl ring-4 ring-emerald-300'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={`${currentRound}_${idx}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(idx, card)}
                  className={`p-3 sm:p-5 rounded-3xl border-4 text-center min-h-[150px] sm:min-h-[175px] flex flex-col items-center justify-center gap-1 shadow-card transition-all cursor-pointer ${cardStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-5xl sm:text-6xl font-black ${isSelected ? 'text-white' : theme.text}`}
                  >
                    {card.letter}
                  </ArabicText>
                  {card.name && (
                    <span className={`text-xs font-black truncate max-w-full ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {card.name}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Feedback explanation on select */}
          {selectedIdx !== null && cards[selectedIdx] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl text-center text-sm font-bold shadow ${
                cards[selectedIdx].isOdd
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {cards[selectedIdx].isOdd ? (
                <span>🌟 Excellent! {cards[selectedIdx].explanation || 'You spotted the odd one!'}</span>
              ) : (
                <span>Oops! That letter belongs to the group. Keep looking! 👀</span>
              )}
            </motion.div>
          )}
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
