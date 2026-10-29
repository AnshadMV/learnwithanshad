import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function TrainCouplerGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playBoing, playFanfare } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'train-coupler',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const idx = (i * 4) % (ARABIC_LETTERS.length - 1)
      const first = ARABIC_LETTERS[idx]
      const next = ARABIC_LETTERS[idx + 1]
      const wrong = pickRandom(ARABIC_LETTERS.filter(l => l.id !== next.id && l.id !== first.id), 3)
      const options = shuffle([next, ...wrong])
      list.push({ first, next, options })
    }
    return list
  }, [])

  const current = rounds[round] || rounds[0]

  const handleStart = () => {
    startGame()
    playBoing()
    setRound(0)
    setGameState('playing')
  }

  const handleCouple = async (selected: any) => {
    if (selected.id === current.next.id) {
      playCorrect()
      recordAnswer(true, 15)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    if (round < rounds.length - 1) {
      setTimeout(() => setRound(r => r + 1), 600)
    } else {
      const res = await completeGame()
      setResult(res)
      setGameState('completed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade</span>
        </Button>
        <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
          Train Station {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-red-200">
          <div className="text-6xl animate-bounce-gentle">🚂</div>
          <h1 className="text-3xl font-black text-gray-800">Train Cargo Coupler</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            All aboard the Arabic Express! Couple the next railcar in correct alphabetical order!
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-red-500 hover:bg-red-600">
            Start Train 🚃
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 p-8 rounded-3xl shadow-lg text-white text-center relative">
            <div className="flex items-center justify-center gap-3 text-4xl mb-3">
              <span>🚂</span>
              <span>🚃</span>
              <div className="px-4 py-2 bg-white text-gray-800 rounded-xl font-arabic font-black text-3xl" dir="rtl">
                {current.first.letter}
              </div>
              <span className="text-white text-2xl font-bold">➔</span>
              <div className="px-4 py-2 bg-red-200 text-red-900 border-2 border-dashed border-white rounded-xl font-bold text-2xl">
                ?
              </div>
            </div>
            <p className="text-red-100 font-bold uppercase tracking-wider text-xs">
              Which letter comes right after {current.first.name_english}?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCouple(opt)}
                className="bg-white border-4 border-red-200 hover:border-red-400 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="text-2xl">🚃</div>
                <span className="text-4xl font-black font-arabic text-gray-800 group-hover:text-red-600" dir="rtl">
                  {opt.letter}
                </span>
                <span className="text-xs text-gray-400 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Train Cargo Coupler"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
