import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Flame } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function LanternGlowGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playSparkle, playStar } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'lantern-glow',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 5 + 1) % ARABIC_LETTERS.length]
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

  const handleLightLantern = async (selected: any) => {
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
        <span className="text-sm font-bold text-amber-300 bg-slate-900 px-3 py-1 rounded-full border border-amber-400/30">
          Lantern Courtyard {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-amber-300/40 text-white">
          <div className="text-6xl animate-bounce-gentle">🏮</div>
          <h1 className="text-3xl font-black text-amber-300 font-display">Ramadan Lantern Glow</h1>
          <p className="text-gray-300 max-w-md mx-auto">
            Light up the festive courtyard fanous lanterns! Choose and illuminate the glowing lantern that displays the requested Arabic letter.
          </p>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base font-black">
            Light Lanterns 🏮
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 p-8 rounded-3xl shadow-xl text-white text-center relative border border-amber-400/30 overflow-hidden">
            <Flame className="w-10 h-10 mx-auto text-amber-400 animate-pulse mb-2" />
            <p className="text-amber-200 font-bold uppercase tracking-wider text-xs">Light up lantern for:</p>
            <div className="text-6xl font-black font-arabic my-2 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" dir="rtl">
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
                onClick={() => handleLightLantern(opt)}
                className="bg-slate-900/90 border-2 border-indigo-700 hover:border-amber-400 p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="text-3xl">🏮</div>
                <span className="text-4xl font-black font-arabic text-amber-200 group-hover:text-amber-400" dir="rtl">
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
          gameName="Ramadan Lantern Glow"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
