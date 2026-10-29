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
import { pickRandom, shuffleArray } from '@/lib/utils'

interface Fish {
  id: number
  letter: string
  color: string
}

const FISH_COLORS = ['bg-amber-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-rose-400', 'bg-purple-400']

export default function LetterFishingGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-fishing',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetChar, setTargetChar] = useState('ج')
  const [fishes, setFishes] = useState<Fish[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const startRound = (idx: number) => {
    const target = ARABIC_LETTERS[(idx * 4) % ARABIC_LETTERS.length].letter
    setTargetChar(target)

    const others = pickRandom(
      ARABIC_LETTERS.filter(l => l.letter !== target),
      4
    ).map(l => l.letter)

    const list: Fish[] = [
      { id: 1, letter: target, color: FISH_COLORS[0] },
      { id: 2, letter: others[0], color: FISH_COLORS[1] },
      { id: 3, letter: others[1], color: FISH_COLORS[2] },
      { id: 4, letter: others[2], color: FISH_COLORS[3] },
      { id: 5, letter: others[3], color: FISH_COLORS[4] },
    ]

    setFishes(shuffleArray(list))
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleCatchFish = async (fish: Fish) => {
    playClick()
    const isTarget = fish.letter === targetChar

    if (isTarget) {
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
    }, 900)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-4xl shadow-sm">
            🎣
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Fishing
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Cast your line into the blue lagoon and catch the fish carrying the target letter!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Go Fishing! 🐟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center flex items-center justify-center gap-3 border-4 border-cyan-200">
            <span className="text-sm font-bold text-gray-700">Catch the fish with:</span>
            <span className="w-12 h-12 rounded-2xl bg-cyan-500 text-white font-arabic font-bold text-2xl flex items-center justify-center shadow">
              {targetChar}
            </span>
          </div>

          {/* Undersea Pond */}
          <div className="h-80 rounded-3xl bg-gradient-to-b from-cyan-300 via-blue-400 to-blue-600 p-6 relative overflow-hidden shadow-card flex flex-col justify-around">
            {/* Gentle bubbles */}
            <div className="absolute top-4 left-10 text-xl opacity-40">🫧</div>
            <div className="absolute top-20 right-16 text-xl opacity-40">🫧</div>

            {fishes.map((fish, idx) => (
              <motion.button
                key={fish.id}
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCatchFish(fish)}
                className={`self-center w-48 py-2.5 px-4 rounded-full ${fish.color} text-white font-bold shadow-lg flex items-center justify-between border-2 border-white/60 cursor-pointer`}
              >
                <span className="text-2xl">🐟</span>
                <ArabicText size="2xl" weight="bold" className="text-white drop-shadow">
                  {fish.letter}
                </ArabicText>
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Catch
                </span>
              </motion.button>
            ))}
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
