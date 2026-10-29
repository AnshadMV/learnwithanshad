import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function FindDifferentLetterGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'find-different',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [cards, setCards] = useState<{ id: string; letter: string; isOdd: boolean }[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  const startRound = (roundIdx: number) => {
    // Pick common letter and 1 odd letter
    const [common, odd] = pickRandom(ARABIC_LETTERS, 2)
    const list = [
      { id: '1', letter: common.letter, isOdd: false },
      { id: '2', letter: common.letter, isOdd: false },
      { id: '3', letter: common.letter, isOdd: false },
      { id: '4', letter: common.letter, isOdd: false },
      { id: '5', letter: odd.letter, isOdd: true },
    ]
    setCards(shuffleArray(list))
    setSelectedIdx(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleCardClick = async (idx: number, isOdd: boolean) => {
    if (selectedIdx !== null) return
    setSelectedIdx(idx)

    if (isOdd) {
      playCorrect()
      recordAnswer(true, 10)
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
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sunny-100 text-sunny-600 flex items-center justify-center text-4xl shadow-sm">
            🕵️
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Find the Different Letter
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Four letters are identical twins! Tap the ONE letter that is different from the rest.
            </p>
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Detective Mission! 🔍
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-sunny-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <h2 className="text-xl font-black text-gray-800 mt-1">
              Spot the Odd Letter Out! 🕵️
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {cards.map((card, idx) => {
              const isSelected = selectedIdx === idx
              let cardStyle = 'bg-white border-gray-200 hover:border-sunny-400'
              if (isSelected) {
                cardStyle = card.isOdd
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(idx, card.isOdd)}
                  className={`p-4 sm:p-6 rounded-3xl border-4 text-center min-h-[140px] flex items-center justify-center shadow-card transition-all ${cardStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={isSelected ? 'text-white' : 'text-gray-800'}
                  >
                    {card.letter}
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
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
