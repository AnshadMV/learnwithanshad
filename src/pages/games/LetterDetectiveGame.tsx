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
import { pickRandom } from '@/lib/utils'

export default function LetterDetectiveGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-detective',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetChar, setTargetChar] = useState('ب')
  const [streamLetters, setStreamLetters] = useState<string[]>([])
  const [actualCount, setActualCount] = useState(2)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const startRound = (idx: number) => {
    const target = ARABIC_LETTERS[idx % ARABIC_LETTERS.length].letter
    setTargetChar(target)

    const others = pickRandom(
      ARABIC_LETTERS.filter(l => l.letter !== target),
      3
    ).map(l => l.letter)

    // Random occurrences between 1 and 4
    const count = Math.floor(Math.random() * 3) + 1
    setActualCount(count)

    const pool: string[] = []
    for (let i = 0; i < count; i++) pool.push(target)
    for (let i = 0; i < 7 - count; i++) {
      pool.push(others[i % others.length])
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    setStreamLetters(pool)
    setSelectedAnswer(null)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            🔎
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Detective
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Scan the row of Arabic letters carefully and count how many times the target letter appears!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Detective Scan! 🔍
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-purple-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-lg font-bold text-gray-700">How many times do you see:</span>
              <span className="w-12 h-12 rounded-2xl bg-brand-blue text-white font-arabic font-bold text-2xl flex items-center justify-center shadow">
                {targetChar}
              </span>
            </div>
          </div>

          {/* Letter Stream Box */}
          <div className="bg-white rounded-3xl p-8 shadow-card flex items-center justify-center gap-3 sm:gap-5 border-2 border-gray-100 overflow-x-auto">
            {streamLetters.map((l, i) => (
              <span
                key={i}
                className="w-12 h-14 sm:w-16 sm:h-18 rounded-2xl bg-sky flex items-center justify-center font-arabic text-2xl sm:text-3xl font-bold text-gray-800 shadow-inner select-none"
              >
                {l}
              </span>
            ))}
          </div>

          {/* Number Options */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(num => {
              const isSelected = selectedAnswer === num
              const isRight = num === actualCount

              let btnStyle = 'bg-white border-gray-200 hover:border-purple-300'
              if (isSelected) {
                btnStyle = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePickCount(num)}
                  className={`p-6 rounded-3xl border-4 text-center font-black text-2xl shadow-card transition-all ${btnStyle}`}
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
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
