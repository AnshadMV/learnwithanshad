import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Orbit } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function SolarOrbitGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playStar, playWhoosh } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'solar-orbit',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 4 + 4) % ARABIC_LETTERS.length]
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

  const handleAlignPlanet = async (selected: any) => {
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
        <span className="text-sm font-bold text-indigo-400 bg-slate-800 px-3 py-1 rounded-full border border-indigo-500/30">
          Orbit Alignment {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-indigo-400/40 text-white">
          <div className="text-6xl animate-bounce-gentle">🪐</div>
          <h1 className="text-3xl font-black text-indigo-300 font-display">Solar Orbit Explorer</h1>
          <p className="text-gray-300 max-w-md mx-auto">
            Travel through deep space! Align the glowing planet that carries the matching Arabic letter into orbital harmony.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-indigo-600 hover:bg-indigo-700">
            Launch Spaceship 🚀
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-lg text-white text-center relative border border-indigo-800/50">
            <Orbit className="w-12 h-12 mx-auto text-indigo-300 animate-spin mb-2" style={{ animationDuration: '8s' }} />
            <p className="text-indigo-200 font-bold uppercase tracking-wider text-xs">Align Planet with Letter:</p>
            <div className="text-6xl font-black font-arabic my-2 text-indigo-300 drop-shadow" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-gray-400 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAlignPlanet(opt)}
                className="bg-slate-900 border-2 border-indigo-700 hover:border-cyan-400 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="text-3xl">🪐</div>
                <span className="text-4xl font-black font-arabic text-indigo-200 group-hover:text-white" dir="rtl">
                  {opt.letter}
                </span>
                <span className="text-xs text-indigo-400 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Solar Orbit Explorer"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
