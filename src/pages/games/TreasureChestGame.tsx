import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Unlock, KeyRound } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import ProgressBar from '@/components/ui/ProgressBar'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

export default function TreasureChestGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'treasure-chest',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [unlockedLocks, setUnlockedLocks] = useState(0)
  const [targetLetter, setTargetLetter] = useState(ARABIC_LETTERS[0])
  const [options, setOptions] = useState<typeof ARABIC_LETTERS>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_LOCKS = 5

  const startQuestion = (lockIdx: number) => {
    const target = ARABIC_LETTERS[(lockIdx * 5) % ARABIC_LETTERS.length]
    setTargetLetter(target)

    const distractors = pickRandom(
      ARABIC_LETTERS.filter(l => l.id !== target.id),
      3
    )

    setOptions(shuffleArray([target, ...distractors]))
  }

  const handleStart = () => {
    startGame()
    setUnlockedLocks(0)
    startQuestion(0)
    setGameState('playing')
  }

  const handlePick = async (chosen: typeof ARABIC_LETTERS[0]) => {
    playClick()
    const isCorrect = chosen.id === targetLetter.id

    if (isCorrect) {
      playCorrect()
      recordAnswer(true, 10)
      const nextUnlocked = unlockedLocks + 1
      setUnlockedLocks(nextUnlocked)

      if (nextUnlocked >= TOTAL_LOCKS) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        startQuestion(nextUnlocked)
      }
    } else {
      playWrong()
      recordAnswer(false, 0)
    }
  }

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-4xl shadow-sm">
            🏆
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Treasure Chest Challenge
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Solve 5 letter questions to unlock all the golden padlocks and reveal pirate treasure!
            </p>
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Unlock the Treasure! 🗝️
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Treasure Box Visual */}
          <div className="bg-gradient-to-b from-amber-50 to-orange-100 rounded-3xl p-6 text-center space-y-3 border-4 border-amber-300 shadow-card">
            <span className="text-6xl block animate-bounce-gentle select-none">
              {unlockedLocks === 0 ? '🔒' : unlockedLocks < 5 ? '🗝️' : '💎'}
            </span>
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: TOTAL_LOCKS }).map((_, i) => (
                <span key={i} className="text-2xl">
                  {i < unlockedLocks ? '🔓' : '🔒'}
                </span>
              ))}
            </div>
            <div className="max-w-xs mx-auto">
              <ProgressBar value={(unlockedLocks / TOTAL_LOCKS) * 100} color="bg-amber-500" />
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center space-y-4 border-2 border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Pick the key for letter <span className="text-brand-blue font-extrabold">{targetLetter.name_english}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {options.map((letter, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePick(letter)}
                  className="p-6 rounded-3xl border-2 border-amber-200 hover:border-amber-400 bg-white text-center min-h-[120px] flex flex-col items-center justify-center shadow-card transition-all"
                >
                  <ArabicText size="3xl" weight="bold" className="text-brand-blue">
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
