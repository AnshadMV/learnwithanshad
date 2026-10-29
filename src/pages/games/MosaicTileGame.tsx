import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Palette } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function MosaicTileGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playSparkle, playCoin } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'mosaic-tile',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    for (let i = 0; i < 5; i++) {
      const target = paramLetter
        ? ARABIC_LETTERS.find(l => l.id === paramLetter) || ARABIC_LETTERS[i]
        : ARABIC_LETTERS[(i * 5 + 4) % ARABIC_LETTERS.length]
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

  const handlePlaceTile = async (selected: any) => {
    if (selected.id === current.target.id) {
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
        <span className="text-sm font-bold text-teal-900 bg-teal-100 px-3 py-1 rounded-full">
          Palace Mosaic {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-teal-300">
          <div className="text-6xl animate-bounce-gentle">🎨</div>
          <h1 className="text-3xl font-black text-gray-800">Mosaic Tile Artisan</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Design gorgeous palace zellij mosaics! Select and place the handcrafted geometric tile stamped with the target Arabic letter.
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-teal-600 hover:bg-teal-700">
            Tile Palace 🏺
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-teal-700 via-cyan-600 to-blue-700 p-8 rounded-3xl shadow-lg text-white text-center relative overflow-hidden">
            <Palette className="w-10 h-10 mx-auto text-teal-200 mb-2" />
            <p className="text-teal-100 font-bold uppercase tracking-wider text-xs">Place mosaic tile for:</p>
            <div className="text-6xl font-black font-arabic my-2 drop-shadow" dir="rtl">
              {current.target.letter}
            </div>
            <p className="text-teal-100 text-sm font-semibold">({current.target.name_english})</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handlePlaceTile(opt)}
                className="bg-teal-50/70 border-4 border-teal-300 hover:border-teal-500 p-6 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-200/80 border-2 border-teal-400 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                  <span className="text-3xl font-black font-arabic text-teal-950" dir="rtl">
                    {opt.letter}
                  </span>
                </div>
                <span className="text-xs text-teal-700 font-bold">{opt.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Mosaic Tile Artisan"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
