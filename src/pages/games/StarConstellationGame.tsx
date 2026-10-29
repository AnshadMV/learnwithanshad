import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Star } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function StarConstellationGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playStar, playSparkle } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'star-constellation',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 3 + 1) % ARABIC_LETTERS.length]
      const wrong = pickRandom(ARABIC_LETTERS.filter(l => l.id !== target.id), 3)
      const options = shuffle([target, ...wrong])
      list.push({ target, options })
    }
    return list
  }, [paramLetter])

  const current = rounds[round] || rounds[0]

  const handleStart = () => {
    startGame()
    playSparkle()
    setRound(0)
    setGameState('playing')
  }

  const handleConnectStar = async (selected: any) => {
    if (selected.id === current.target.id) {
      playCorrect()
      playStar()
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
        <span className="text-sm font-bold text-amber-300 bg-slate-800 px-3 py-1 rounded-full border border-amber-400/30">
          Starlight Sky {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-amber-300/40 text-white">
          <div className="text-6xl animate-bounce-gentle">🌌</div>
          <h1 className="text-3xl font-black text-amber-300 font-display">Star Constellation</h1>
          <p className="text-gray-300 max-w-md mx-auto">
            Gaze into the starlit desert sky! Connect the glowing cosmic stars to form glowing Arabic letters.
          </p>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base font-black">
            Stargaze Now 🌟
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-xl text-white text-center border border-indigo-800/50 relative overflow-hidden">
            <div className="flex justify-center gap-2 mb-2">
              <Star className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <Star className="w-8 h-8 text-amber-300 fill-amber-300 animate-pulse" />
              <Star className="w-6 h-6 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <p className="text-amber-200 font-bold uppercase tracking-wider text-xs">Form the Star Constellation:</p>
            <div className="text-7xl font-black font-arabic my-3 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-gray-300 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleConnectStar(opt)}
                className="bg-slate-900 border-2 border-indigo-700 hover:border-amber-400 p-6 rounded-2xl shadow-md text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <Sparkles className="w-6 h-6 text-indigo-400 group-hover:text-amber-300 transition-colors" />
                <span className="text-4xl font-black font-arabic text-white group-hover:text-amber-300 transition-colors" dir="rtl">
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
          gameName="Star Constellation"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
