import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Rocket, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterVariants } from '@/data/letterVariants'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

interface RocketOption {
  id: string
  letter: string
  name: string
  isCorrect: boolean
}

export default function RocketRaceGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playStar } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'rocket-race',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentStep, setCurrentStep] = useState(0)
  const [targetChar, setTargetChar] = useState('ا')
  const [targetName, setTargetName] = useState('Alef')
  const [options, setOptions] = useState<RocketOption[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_STEPS = 5

  const variants = useMemo(() => {
    if (paramLetter) {
      return getLetterVariants(paramLetter)
    }
    return []
  }, [paramLetter])

  const startStep = (step: number) => {
    if (paramLetter && variants.length > 0) {
      const v = variants[step % variants.length]
      setTargetChar(v.char)
      setTargetName(v.name)

      const others = variants.filter(item => item.id !== v.id)
      const distractors = pickRandom(others, 3)

      const combined: RocketOption[] = shuffleArray([
        { id: v.id, letter: v.char, name: v.name, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, letter: d.char, name: d.name, isCorrect: false })),
      ])

      setOptions(combined)
      setTimeout(() => speak(v.char), 200)
    } else {
      const target = ARABIC_LETTERS[(step * 6) % ARABIC_LETTERS.length]
      setTargetChar(target.letter)
      setTargetName(target.name_english)

      const distractors = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== target.id),
        3
      )

      const combined: RocketOption[] = shuffleArray([
        { id: target.id, letter: target.letter, name: target.name_english, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, letter: d.letter, name: d.name_english, isCorrect: false })),
      ])

      setOptions(combined)
      setTimeout(() => speak(target.letter), 200)
    }
  }

  const handleStart = () => {
    startGame()
    setCurrentStep(0)
    startStep(0)
    setGameState('playing')
  }

  const handleChoose = async (opt: RocketOption) => {
    speak(opt.letter)
    const isCorrect = opt.isCorrect

    if (isCorrect) {
      playCorrect()
      playStar()
      celebrate()
      recordAnswer(true, 15)
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)

      if (nextStep >= TOTAL_STEPS) {
        setTimeout(async () => {
          const res = await completeGame()
          setResult(res)
          setGameState('completed')
        }, 700)
      } else {
        startStep(nextStep)
      }
    } else {
      playWrong()
      recordAnswer(false, 0)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
          className="flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{paramLetter ? 'Back to Letter' : 'Arcade Home'}</span>
        </Button>
        <div className="text-sm font-bold text-gray-500">
          Score: <span className="text-brand-blue font-black text-lg">{score}</span>
        </div>
      </div>

      {/* Letter Scope Banner */}
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="rocket-race" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl shadow-sm">
            🚀
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Rocket Race to Space
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Space Mission ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Fuel the rocket thrusters with the matching forms and vowels of letter <strong>{targetLetterObj.name_english}</strong> to blast off!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Fuel up the rocket by answering letter questions and blast into outer space!
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Launch Rocket! 🚀
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Race track progress */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white border-4 border-indigo-400/40">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-mono mb-2">
              <span>LAUNCH PAD</span>
              <span>ALTITUDE: {currentStep * 20}%</span>
              <span>ORBIT 🌌</span>
            </div>

            <div className="relative h-16 bg-slate-800/80 rounded-2xl flex items-center px-4 overflow-hidden border border-slate-700">
              <motion.div
                className="absolute text-4xl"
                animate={{ left: `${(currentStep / TOTAL_STEPS) * 85 + 5}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                🚀
              </motion.div>
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-indigo-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Thruster Ignition {currentStep + 1} of {TOTAL_STEPS}
            </span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-lg font-bold text-gray-700">Fuel rocket with:</span>
              <span className="min-w-14 px-3 h-14 rounded-2xl bg-indigo-600 text-white font-arabic font-bold text-3xl flex items-center justify-center shadow">
                {targetChar}
              </span>
              <button
                onClick={() => speak(targetChar)}
                className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1">{targetName}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {options.map((opt, idx) => {
              const theme = getKidCardTheme(idx)
              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChoose(opt)}
                  className={`p-6 rounded-3xl border-4 ${theme.border} ${theme.bg} ${theme.hoverBorder} ${theme.hoverBg} text-center shadow-card transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[140px] sm:min-h-[160px]`}
                >
                  <ArabicText size="3xl" weight="bold" className={`text-5xl sm:text-6xl font-black ${theme.text}`}>
                    {opt.letter}
                  </ArabicText>
                  <span className="text-xs font-black text-gray-700 truncate max-w-full">
                    {opt.name}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          onReplay={handleStart}
          onHome={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
        />
      )}
    </div>
  )
}
