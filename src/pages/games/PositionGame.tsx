import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES, LetterExample } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'

export default function PositionGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'position-game',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetExample, setTargetExample] = useState<LetterExample>(LETTER_EXAMPLES[0])
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  const startRound = (idx: number) => {
    const ex = LETTER_EXAMPLES[(idx * 17) % LETTER_EXAMPLES.length]
    setTargetExample(ex)
    setSelectedPosition(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handlePickPosition = async (pos: 'beginning' | 'middle' | 'end') => {
    if (selectedPosition !== null) return
    setSelectedPosition(pos)

    const isCorrect = pos === targetExample.letter_position

    if (isCorrect) {
      playCorrect()
      recordAnswer(true, 10)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        const next = currentRound + 1
        setCurrentRound(next)
        startRound(next)
      }
    }, 1100)
  }

  const letterObj = ARABIC_LETTERS.find(l => l.id === targetExample.letter_id)

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-4xl shadow-sm">
            📍
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Beginning, Middle, or End?
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Where is the target letter located in the word? At the beginning, in the middle, or at the end?
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Find the Position! 🎯
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-3 border-4 border-pink-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <div className="text-6xl">{targetExample.emoji}</div>
            <div className="py-2">
              <ArabicText size="3xl" weight="bold" className="text-brand-blue">
                {targetExample.arabic_word}
              </ArabicText>
              <div className="text-xs font-bold text-gray-400 mt-1">
                {targetExample.english_meaning} ({targetExample.transliteration})
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 text-sm font-extrabold text-gray-700">
              Where is the letter <span className="font-arabic text-xl text-pink-600 font-black">{letterObj?.letter}</span> in this word?
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(['beginning', 'middle', 'end'] as const).map(pos => {
              const isSelected = selectedPosition === pos
              const isRight = pos === targetExample.letter_position

              let btnStyle = 'bg-white border-gray-200 hover:border-pink-300'
              if (isSelected) {
                btnStyle = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={pos}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePickPosition(pos)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[120px] flex flex-col items-center justify-center shadow-card transition-all capitalize font-black text-lg ${btnStyle}`}
                >
                  <span className="text-2xl mb-1">
                    {pos === 'beginning' ? '🟢' : pos === 'middle' ? '🟡' : '🔴'}
                  </span>
                  <span>{pos}</span>
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
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
