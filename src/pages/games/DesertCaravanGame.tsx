import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Package } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function DesertCaravanGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playCoin, playWhoosh } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'desert-caravan',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter 
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i % ARABIC_LETTERS.length]
        : ARABIC_LETTERS[(i * 5) % ARABIC_LETTERS.length]
      
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

  const handleSelectBox = async (selectedLetter: any) => {
    if (selectedLetter.id === current.target.id) {
      playCorrect()
      playCoin()
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
        <span className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          Caravan Round {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-amber-200">
          <div className="text-6xl animate-bounce-gentle">🐪</div>
          <h1 className="text-3xl font-black text-gray-800">Desert Caravan Sorter</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Help the friendly camels carry cargo across the golden dunes! Pick the crate stamped with the matching Arabic letter.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-amber-500 hover:bg-amber-600">
            Start Caravan 📦
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {/* Camel Banner */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
            <div className="text-6xl mb-2">🐪</div>
            <p className="text-amber-900 font-bold uppercase tracking-wider text-xs">Camel needs letter:</p>
            <div className="text-6xl font-black font-arabic my-2 drop-shadow" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-amber-900 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          {/* Cargo Crates Grid */}
          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectBox(opt)}
                className="bg-white border-4 border-amber-300 hover:border-amber-500 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <Package className="w-8 h-8 text-amber-500 group-hover:rotate-12 transition-transform" />
                <span className="text-4xl font-black font-arabic text-gray-800" dir="rtl">
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
          gameName="Desert Caravan Sorter"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
