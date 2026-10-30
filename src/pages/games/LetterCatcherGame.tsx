import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { getConfusableDistractors } from '@/data/letterPedagogy'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom } from '@/lib/utils'

interface FallingItem {
  id: number
  letter: string
  x: number
  y: number
  isTarget: boolean
}

export default function LetterCatcherGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetObj = useMemo(() => {
    if (paramLetter) {
      return ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[23]
    }
    return ARABIC_LETTERS[23]
  }, [paramLetter])

  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-catcher',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [targetChar, setTargetChar] = useState(targetObj.letter)
  const [basketX, setBasketX] = useState(50) // percentage
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([])
  const [lives, setLives] = useState(3)
  const [result, setResult] = useState<GameResult | null>(null)

  const distractorLetters = useMemo(() => {
    const confusableIds = getConfusableDistractors(targetObj.id, 4)
    if (confusableIds.length >= 2) {
      return confusableIds.map(id => ARABIC_LETTERS.find(l => l.id === id)?.letter).filter(Boolean) as string[]
    }
    return ARABIC_LETTERS.filter(l => l.id !== targetObj.id).map(l => l.letter)
  }, [targetObj])

  const handleStart = () => {
    startGame()
    const target = targetObj.letter
    setTargetChar(target)
    setLives(3)
    setBasketX(50)
    setFallingItems([])
    setGameState('playing')
  }

  // Spawner and falling physics loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const spawnInterval = setInterval(() => {
      const isTarget = Math.random() > 0.4
      const char = isTarget
        ? targetChar
        : pickRandom(distractorLetters, 1)[0]

      setFallingItems(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          letter: char,
          x: Math.floor(Math.random() * 80) + 10,
          y: 0,
          isTarget,
        },
      ])
    }, 1800)

    const moveInterval = setInterval(() => {
      setFallingItems(prev => {
        const next: FallingItem[] = []
        for (const item of prev) {
          const nextY = item.y + 5
          // Check collision with basket at bottom (y > 75)
          if (nextY >= 75 && nextY <= 85) {
            const distance = Math.abs(item.x - basketX)
            if (distance < 15) {
              // Caught in basket!
              if (item.isTarget) {
                playCorrect()
                recordAnswer(true, 10)
              } else {
                playWrong()
                recordAnswer(false, 0)
                setLives(l => {
                  const remaining = l - 1
                  if (remaining <= 0) {
                    completeGame().then(res => {
                      setResult(res)
                      setGameState('completed')
                    })
                  }
                  return remaining
                })
              }
              continue // item absorbed
            }
          }

          if (nextY < 95) {
            next.push({ ...item, y: nextY })
          }
        }
        return next
      })
    }, 100)

    return () => {
      clearInterval(spawnInterval)
      clearInterval(moveInterval)
    }
  }, [gameState, basketX, targetChar])

  const moveBasket = (dir: 'left' | 'right') => {
    setBasketX(prev => (dir === 'left' ? Math.max(10, prev - 12) : Math.min(90, prev + 12)))
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < lives ? 'text-rose-500 fill-rose-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-sm font-bold text-gray-500">
            Score: <span className="text-brand-blue font-black text-lg">{score}</span>
          </div>
        </div>
      </div>

      {/* Letter-Specific Mode Banner */}
      {paramLetter && (
        <div className="flex items-center gap-2 text-sm font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2">
          <span>🎯</span>
          <span>Catching Stars for Letter: <span className="font-arabic text-lg ml-1" dir="rtl">{targetObj.letter}</span> ({targetObj.name_english})</span>
        </div>
      )}

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            🤸
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Catcher
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Slide your basket left and right to catch the falling target Arabic letter! Avoid distractors.
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Catching! 🧺
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-card text-center flex items-center justify-center gap-3 border-2 border-purple-200">
            <span className="text-sm font-bold text-gray-700">Catch letter:</span>
            <span className="w-10 h-10 rounded-xl bg-purple-600 text-white font-arabic font-bold text-xl flex items-center justify-center shadow">
              {targetChar}
            </span>
          </div>

          {/* Catching Sky Arena */}
          <div className="relative h-96 bg-gradient-to-b from-sky via-purple-50 to-white rounded-3xl border-4 border-purple-200 overflow-hidden shadow-card select-none">
            {/* Falling Letters */}
            {fallingItems.map(item => (
              <div
                key={item.id}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className="absolute w-12 h-12 rounded-2xl bg-white border-2 border-purple-300 text-purple-800 font-arabic font-bold text-xl flex items-center justify-center shadow transform -translate-x-1/2"
              >
                {item.letter}
              </div>
            ))}

            {/* Moving Basket */}
            <div
              style={{ left: `${basketX}%` }}
              className="absolute bottom-4 w-24 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center text-2xl shadow-xl transform -translate-x-1/2 border-2 border-amber-300 transition-all duration-75"
            >
              🧺
            </div>
          </div>

          {/* Basket Left / Right Touch Controls */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => moveBasket('left')}
              className="w-full py-4 text-lg font-bold"
            >
              ⬅️ Move Left
            </Button>
            <Button
              variant="secondary"
              onClick={() => moveBasket('right')}
              className="w-full py-4 text-lg font-bold"
            >
              Move Right ➡️
            </Button>
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
