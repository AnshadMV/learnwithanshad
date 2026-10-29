import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray } from '@/lib/utils'

interface WordQuestion {
  displayWord: string
  missingChar: string
  options: string[]
  english: string
  emoji: string
}

const QUESTIONS: WordQuestion[] = [
  {
    displayWord: 'بَـ_ـت',
    missingChar: 'ي',
    options: ['ي', 'س', 'ن', 'ر'],
    english: 'House (Bayt)',
    emoji: '🏠',
  },
  {
    displayWord: 'كِـ_ـاب',
    missingChar: 'ت',
    options: ['ت', 'ب', 'م', 'د'],
    english: 'Book (Kitāb)',
    emoji: '📖',
  },
  {
    displayWord: 'أَ_ـد',
    missingChar: 'س',
    options: ['س', 'ش', 'ص', 'ج'],
    english: 'Lion (Asad)',
    emoji: '🦁',
  },
  {
    displayWord: 'شَـ_ـس',
    missingChar: 'م',
    options: ['م', 'ن', 'ل', 'ك'],
    english: 'Sun (Shams)',
    emoji: '☀️',
  },
  {
    displayWord: 'قَـ_ـر',
    missingChar: 'م',
    options: ['م', 'و', 'ب', 'ف'],
    english: 'Moon (Qamar)',
    emoji: '🌙',
  },
  {
    displayWord: 'بَـ_ـة',
    missingChar: 'ط',
    options: ['ط', 'ظ', 'ص', 'ت'],
    english: 'Duck (Baṭṭah)',
    emoji: '🦆',
  },
]

export default function CompleteWordGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'complete-word',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const currentQ = QUESTIONS[currentIdx]

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    setSelectedChar(null)
    setGameState('playing')
  }

  const handleSelect = async (char: string) => {
    if (selectedChar !== null) return
    setSelectedChar(char)

    const isCorrect = char === currentQ.missingChar

    if (isCorrect) {
      playCorrect()
      recordAnswer(true, 10)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (currentIdx + 1 >= QUESTIONS.length) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        setCurrentIdx(prev => prev + 1)
        setSelectedChar(null)
      }
    }, 1100)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            📝
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Complete the Word
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              One letter is missing from the illustrated Arabic word. Pick the right letter to complete it!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Complete Words! 🌟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-purple-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Word {currentIdx + 1} of {QUESTIONS.length}
            </span>
            <div className="text-6xl">{currentQ.emoji}</div>
            <div className="font-extrabold text-gray-700 text-lg">{currentQ.english}</div>
            <div className="py-4">
              <ArabicText size="3xl" weight="bold" className="text-brand-blue tracking-wider">
                {currentQ.displayWord}
              </ArabicText>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {currentQ.options.map((char, idx) => {
              const isSelected = selectedChar === char
              const isRight = char === currentQ.missingChar

              let btnStyle = 'bg-white border-gray-200 hover:border-purple-300'
              if (isSelected) {
                btnStyle = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(char)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[120px] flex items-center justify-center shadow-card transition-all ${btnStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={isSelected ? 'text-white' : 'text-gray-800'}
                  >
                    {char}
                  </ArabicText>
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
