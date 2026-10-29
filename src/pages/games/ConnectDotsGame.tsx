import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'

interface Dot {
  num: number
  x: number
  y: number
}

interface DotPuzzle {
  letter: string
  name: string
  dots: Dot[]
}

const PUZZLES: DotPuzzle[] = [
  {
    letter: 'ا',
    name: 'Alef',
    dots: [
      { num: 1, x: 150, y: 40 },
      { num: 2, x: 150, y: 100 },
      { num: 3, x: 150, y: 160 },
      { num: 4, x: 150, y: 220 },
    ],
  },
  {
    letter: 'ب',
    name: 'Ba',
    dots: [
      { num: 1, x: 230, y: 120 },
      { num: 2, x: 200, y: 160 },
      { num: 3, x: 150, y: 170 },
      { num: 4, x: 100, y: 160 },
      { num: 5, x: 70, y: 120 },
      { num: 6, x: 150, y: 210 }, // dot below
    ],
  },
  {
    letter: 'و',
    name: 'Waw',
    dots: [
      { num: 1, x: 150, y: 70 },
      { num: 2, x: 180, y: 80 },
      { num: 3, x: 160, y: 110 },
      { num: 4, x: 140, y: 100 },
      { num: 5, x: 120, y: 170 },
      { num: 6, x: 80, y: 200 },
    ],
  },
]

export default function ConnectDotsGame() {
  const navigate = useNavigate()
  const { playCorrect, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'connect-dots',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [nextExpectedDot, setNextExpectedDot] = useState(1)
  const [connectedDots, setConnectedDots] = useState<Dot[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const currentPuzzle = PUZZLES[currentIdx]

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    setNextExpectedDot(1)
    setConnectedDots([])
    setGameState('playing')
  }

  const handleDotClick = async (dot: Dot) => {
    if (dot.num === nextExpectedDot) {
      playClick()
      const updated = [...connectedDots, dot]
      setConnectedDots(updated)
      setNextExpectedDot(prev => prev + 1)

      // Finished this letter!
      if (updated.length === currentPuzzle.dots.length) {
        playCorrect()
        recordAnswer(true, 15)

        setTimeout(async () => {
          if (currentIdx + 1 >= PUZZLES.length) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          } else {
            setCurrentIdx(prev => prev + 1)
            setNextExpectedDot(1)
            setConnectedDots([])
          }
        }, 900)
      }
    }
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-brand-green flex items-center justify-center text-4xl shadow-sm">
            🔵
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Connect the Dots
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Tap the numbered dots in order (1, 2, 3...) to reveal and connect the Arabic letter!
            </p>
          </div>
          <Button variant="success" onClick={handleStart} className="px-8 py-3.5 text-base">
            Connect the Dots! 🌟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Puzzle {currentIdx + 1} of {PUZZLES.length} • Connect {currentPuzzle.name}
            </span>
          </div>

          <div className="relative w-80 h-72 mx-auto bg-white rounded-3xl shadow-card border-4 border-emerald-100 overflow-hidden flex items-center justify-center">
            {/* SVG Lines between connected dots */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connectedDots.map((dot, i) => {
                if (i === 0) return null
                const prev = connectedDots[i - 1]
                return (
                  <line
                    key={i}
                    x1={prev.x}
                    y1={prev.y}
                    x2={dot.x}
                    y2={dot.y}
                    stroke="#34A853"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                )
              })}
            </svg>

            {/* Clickable Dots */}
            {currentPuzzle.dots.map(dot => {
              const isConnected = connectedDots.some(d => d.num === dot.num)
              const isNext = dot.num === nextExpectedDot

              return (
                <button
                  key={dot.num}
                  onClick={() => handleDotClick(dot)}
                  style={{ left: dot.x - 18, top: dot.y - 18 }}
                  className={`absolute w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shadow transition-all ${
                    isConnected
                      ? 'bg-brand-green text-white scale-90'
                      : isNext
                      ? 'bg-sunny-400 text-gray-900 ring-4 ring-yellow-200 animate-bounce-gentle'
                      : 'bg-white text-gray-500 border border-gray-300'
                  }`}
                >
                  {dot.num}
                </button>
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
