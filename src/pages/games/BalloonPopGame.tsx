import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom } from '@/lib/utils'

interface Balloon {
  id: number
  letter: string
  color: string
  x: number
  popped: boolean
}

const BALLOON_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8B5CF6', '#EC4899']

export default function BalloonPopGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'balloon-pop',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [targetChar, setTargetChar] = useState('ب')
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [timeLeft, setTimeLeft] = useState(25)
  const [result, setResult] = useState<GameResult | null>(null)

  const handleStart = () => {
    startGame()
    const target = ARABIC_LETTERS[1].letter // Ba
    setTargetChar(target)
    setTimeLeft(25)

    // Generate initial balloons
    const initialBalloons: Balloon[] = []
    for (let i = 0; i < 7; i++) {
      const isTarget = i % 2 === 0
      const letter = isTarget
        ? target
        : pickRandom(ARABIC_LETTERS.filter(l => l.letter !== target), 1)[0].letter

      initialBalloons.push({
        id: Date.now() + i,
        letter,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        x: 10 + i * 13,
        popped: false,
      })
    }

    setBalloons(initialBalloons)
    setGameState('playing')
  }

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(async () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          completeGame().then(res => {
            setResult(res)
            setGameState('completed')
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  const handlePop = (balloon: Balloon) => {
    if (balloon.popped) return

    playClick()
    const isTarget = balloon.letter === targetChar

    if (isTarget) {
      playCorrect()
      recordAnswer(true, 10)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    // Mark as popped and spawn replacement
    setBalloons(prev =>
      prev.map(b => (b.id === balloon.id ? { ...b, popped: true } : b))
    )

    setTimeout(() => {
      const isNextTarget = Math.random() > 0.4
      const nextChar = isNextTarget
        ? targetChar
        : pickRandom(ARABIC_LETTERS.filter(l => l.letter !== targetChar), 1)[0].letter

      setBalloons(prev => [
        ...prev.filter(b => b.id !== balloon.id),
        {
          id: Date.now(),
          letter: nextChar,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          x: Math.floor(Math.random() * 80) + 10,
          popped: false,
        },
      ])
    }, 400)
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
          <div className="flex items-center gap-1 text-sm font-bold text-gray-500">
            <Clock className="w-4 h-4 text-brand-coral" />
            <span>{timeLeft}s</span>
          </div>
          <div className="text-sm font-bold text-gray-500">
            Score: <span className="text-brand-blue font-black text-lg">{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            🎈
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Balloon Pop
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Pop all the floating balloons that have the target Arabic letter before the timer runs out!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Balloon Popping! 🎈
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-card text-center flex items-center justify-center gap-3 border-2 border-blue-200">
            <span className="text-sm font-bold text-gray-700">Pop only balloons with:</span>
            <span className="w-10 h-10 rounded-xl bg-brand-blue text-white font-arabic font-bold text-xl flex items-center justify-center shadow">
              {targetChar}
            </span>
          </div>

          {/* Balloon Sky Arena */}
          <div className="relative h-96 bg-gradient-to-b from-sky via-blue-50 to-white rounded-3xl border-4 border-blue-200 overflow-hidden shadow-card select-none">
            {balloons.map(balloon => {
              if (balloon.popped) return null

              return (
                <motion.button
                  key={balloon.id}
                  initial={{ y: 320, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 6, ease: 'linear' }}
                  onClick={() => handlePop(balloon)}
                  style={{
                    left: `${balloon.x}%`,
                    backgroundColor: balloon.color,
                  }}
                  className="absolute w-20 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-lg cursor-pointer transform -translate-x-1/2 hover:scale-110 active:scale-90 transition-transform"
                >
                  <ArabicText size="2xl" weight="bold" className="text-white drop-shadow">
                    {balloon.letter}
                  </ArabicText>
                  {/* Balloon string knot */}
                  <div
                    className="w-2 h-2 rounded-full absolute -bottom-1"
                    style={{ backgroundColor: balloon.color }}
                  />
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
