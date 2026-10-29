import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { pickRandom, shuffle } from '@/lib/utils'

export default function FruitBlenderGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playPop, playSparkle } = useSound()
  const { speak } = useArabicSpeech()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'fruit-blender',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const rounds = useMemo(() => {
    const list = []
    // Pick fruits or items
    for (let i = 0; i < 5; i++) {
      const ex = LETTER_EXAMPLES[(i * 28 + 10) % LETTER_EXAMPLES.length]
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
    playSparkle()
    setRound(0)
    setGameState('playing')
  }

  const handleCatch = async (selected: any) => {
    if (selected.id === current.targetLetter.id) {
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
        <span className="text-sm font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
          Smoothie Blend {round + 1} / 5
        </span>
      </div>

      {gameState === 'intro' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6 border-4 border-rose-200">
          <div className="text-6xl animate-bounce-gentle">🍓</div>
          <h1 className="text-3xl font-black text-gray-800">Fruit Juice Blender</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Drop fresh fruits into the magic blender! Listen to the fruit's name and choose the Arabic starting letter to blend delicious juice!
          </p>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-rose-500 hover:bg-rose-600">
            Start Blending 🍹
          </Button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-8 rounded-3xl shadow-lg text-white text-center relative">
            <div className="text-6xl mb-2">🍹</div>
            <p className="text-rose-100 font-bold uppercase tracking-wider text-xs">Fruit word:</p>
            <div className="text-4xl font-black font-arabic my-2 drop-shadow" dir="rtl">
              {current.ex.arabic_word}
            </div>
            <p className="text-rose-100 text-sm font-bold">"{current.ex.english_meaning}"</p>
            <button
              onClick={() => speak(current.ex.arabic_word)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Pronounce</span>
            </button>
          </div>

          <p className="text-center font-bold text-gray-600 text-sm">
            Which letter starts the word <span className="font-arabic font-bold text-brand-blue" dir="rtl">{current.ex.arabic_word}</span>?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {current.options.map((opt: any) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCatch(opt)}
                className="bg-white border-4 border-rose-200 hover:border-rose-400 p-6 rounded-2xl shadow-sm text-center flex flex-col items-center justify-center gap-2 group transition-all"
              >
                <span className="text-4xl font-black font-arabic text-gray-800 group-hover:text-rose-600 transition-colors" dir="rtl">
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
          gameName="Fruit Juice Blender"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
