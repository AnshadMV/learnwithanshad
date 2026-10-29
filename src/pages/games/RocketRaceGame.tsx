import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

export default function RocketRaceGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'rocket-race',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentStep, setCurrentStep] = useState(0)
  const [targetLetter, setTargetLetter] = useState(ARABIC_LETTERS[0])
  const [options, setOptions] = useState<typeof ARABIC_LETTERS>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_STEPS = 5

  const startStep = (step: number) => {
    const target = ARABIC_LETTERS[(step * 6) % ARABIC_LETTERS.length]
    setTargetLetter(target)

    const distractors = pickRandom(
      ARABIC_LETTERS.filter(l => l.id !== target.id),
      3
    )

    setOptions(shuffleArray([target, ...distractors]))
  }

  const handleStart = () => {
    startGame()
    setCurrentStep(0)
    startStep(0)
    setGameState('playing')
  }

  const handleChoose = async (chosen: typeof ARABIC_LETTERS[0]) => {
    const isCorrect = chosen.id === targetLetter.id

    if (isCorrect) {
      playCorrect()
      recordAnswer(true, 15)
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)

      if (nextStep >= TOTAL_STEPS) {
        setTimeout(async () => {
          const res = await completeGame()
          setResult(res)
          setGameState('completed')
        }, 600)
      } else {
        startStep(nextStep)
      }
    } else {
      playWrong()
      recordAnswer(false, 0)
    }
  }

  const rocketProgressPercent = (currentStep / TOTAL_STEPS) * 85

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade Home</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center text-4xl shadow-sm">
            🚀
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Rocket Letter Race
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Fuel your space rocket by answering Arabic letter questions and race to the moon!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Launch Rocket! 🌟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Race Track */}
          <div className="relative h-28 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 rounded-3xl p-4 shadow-xl border-4 border-indigo-400 overflow-hidden flex items-center">
            {/* Stars background */}
            <div className="absolute inset-0 flex items-center justify-around opacity-30 text-xs text-white">
              <span>✦</span><span>★</span><span>✦</span><span>★</span><span>✦</span>
            </div>

            {/* Finish Line (Moon) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl select-none">
              🌕
            </div>

            {/* Rocket */}
            <motion.div
              animate={{ left: `${rocketProgressPercent}%` }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="absolute text-4xl select-none"
            >
              🚀
            </motion.div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center space-y-4 border-2 border-indigo-100">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Question {currentStep + 1} of {TOTAL_STEPS} • Fuel booster:
            </span>
            <h2 className="text-2xl font-black text-gray-800">
              Which letter is <span className="text-brand-blue">{targetLetter.name_english}</span>?
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {options.map((letter, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChoose(letter)}
                  className="p-6 rounded-3xl border-2 border-indigo-100 hover:border-indigo-400 bg-white text-center min-h-[120px] flex items-center justify-center shadow-card transition-all"
                >
                  <ArabicText size="3xl" weight="bold" className="text-indigo-600">
                    {letter.letter}
                  </ArabicText>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStart}
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
