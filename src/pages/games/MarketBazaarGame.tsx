import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function MarketBazaarGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playCoin, playSparkle } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'market-bazaar',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const ex = LETTER_EXAMPLES[(i * 35 + 5) % LETTER_EXAMPLES.length]
      const targetLetter = ARABIC_LETTERS.find(l => l.id === ex.letter_id) || ARABIC_LETTERS[0]
      const wrong = pickRandom(ARABIC_LETTERS.filter(l => l.id !== targetLetter.id), 3)
      const options = shuffle([targetLetter, ...wrong])
      list.push({ ex, targetLetter, options })
    }
    return list
  }, [])

  const current = rounds[round] || rounds[0]

  const handleStart = () => {
    startGame()
    playCoin()
    setRound(0)
    setGameState('playing')
  }

  const handleBuy = async (selected: any) => {
    if (selected.id === current.targetLetter.id) {
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
        <span className="text-sm font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
          Market Stall {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-amber-300">
          <div className="text-6xl animate-bounce-gentle">🎪</div>
          <h1 className="text-3xl font-black text-gray-800">Market Bazaar Trader</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Welcome to the bustling ancient bazaar! Spend your gold coins to purchase the goods stamped with the correct starting Arabic letter.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-amber-600 hover:bg-amber-700">
            Enter Bazaar 🪙
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 p-8 rounded-3xl shadow-lg text-white text-center relative">
            <Coins className="w-10 h-10 mx-auto text-yellow-200 mb-2" />
            <p className="text-amber-100 font-bold uppercase tracking-wider text-xs">Market item for sale:</p>
            <div className="text-4xl font-black font-arabic my-2 drop-shadow" dir="rtl">
              {current.ex.arabic_word}
            </div>
            <p className="text-amber-100 text-sm font-bold">"{current.ex.english_meaning}"</p>
          </div>

          <p className="text-center font-bold text-gray-600 text-sm">
            What letter begins <span className="font-arabic font-bold text-amber-700" dir="rtl">{current.ex.arabic_word}</span>?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleBuy(opt)}
                className="bg-amber-50 border-4 border-amber-300 hover:border-amber-500 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <span className="text-4xl font-black font-arabic text-amber-950 group-hover:text-amber-600" dir="rtl">
                  {opt.letter}
                </span>
                <span className="text-xs text-amber-700 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Market Bazaar Trader"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
