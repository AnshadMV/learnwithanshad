import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Radar } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function SubmarineSonarGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playPop, playWhoosh } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'submarine-sonar',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 5 + 3) % ARABIC_LETTERS.length]
      const wrong = pickRandom(ARABIC_LETTERS.filter(l => l.id !== target.id), 3)
      const options = shuffle([target, ...wrong])
      list.push({ target, options })
    }
    return list
  }, [paramLetter])

  const current = rounds[round] || rounds[0]

  const handleStart = () => {
    startGame()
    playWhoosh()
    setRound(0)
    setGameState('playing')
  }

  const handlePing = async (selected: any) => {
    if (selected.id === current.target.id) {
      playCorrect()
      playPop()
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
        <span className="text-sm font-bold text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full">
          Deep Dive {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-cyan-200">
          <div className="text-6xl animate-bounce-gentle">🌊</div>
          <h1 className="text-3xl font-black text-gray-800">Submarine Sonar Ping</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Dive beneath the waves in your yellow submarine! Use sonar pings to identify the deep-sea fish carrying the target Arabic letter.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-cyan-600 hover:bg-cyan-700">
            Dive Under 🚢
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 via-cyan-800 to-teal-800 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
            <Radar className="w-10 h-10 mx-auto text-cyan-300 animate-spin mb-2" style={{ animationDuration: '4s' }} />
            <p className="text-cyan-200 font-bold uppercase tracking-wider text-xs">Sonar Target:</p>
            <div className="text-6xl font-black font-arabic my-2 text-cyan-300 drop-shadow" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-cyan-200 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handlePing(opt)}
                className="bg-cyan-950 border-4 border-cyan-600 hover:border-cyan-300 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="text-3xl">🐠</div>
                <span className="text-4xl font-black font-arabic text-cyan-200 group-hover:text-white" dir="rtl">
                  {opt.letter}
                </span>
                <span className="text-xs text-cyan-400 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Submarine Sonar Ping"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
