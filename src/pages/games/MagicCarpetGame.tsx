import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Wind } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function MagicCarpetGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playWhoosh } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'magic-carpet',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 4 + 1) % ARABIC_LETTERS.length]
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

  const handleFlyThrough = async (selected: any) => {
    if (selected.id === current.target.id) {
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
        <span className="text-sm font-bold text-sky-700 bg-sky-100 px-3 py-1 rounded-full">
          Cloud Flight {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-sky-200">
          <div className="text-6xl animate-bounce-gentle">🧞‍♂️</div>
          <h1 className="text-3xl font-black text-gray-800">Magic Carpet Flight</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Soar through the clouds! Steer your magical carpet through the golden sky ring displaying the target letter.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-sky-500 hover:bg-sky-600">
            Take Flight 🪁
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
            <Wind className="w-10 h-10 mx-auto text-sky-100 animate-pulse mb-2" />
            <p className="text-sky-100 font-bold uppercase tracking-wider text-xs">Fly into sky ring:</p>
            <div className="text-6xl font-black font-arabic my-2 drop-shadow" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-sky-100 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleFlyThrough(opt)}
                className="bg-white border-4 border-sky-300 hover:border-amber-400 p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="w-14 h-14 rounded-full border-4 border-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-black font-arabic text-gray-800" dir="rtl">
                    {opt.letter}
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Magic Carpet Flight"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
