import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function LetterPictureMatchGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-picture-match',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetWord, setTargetWord] = useState(LETTER_EXAMPLES[0])
  const [letterOptions, setLetterOptions] = useState<string[]>([])
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  // Filter to words that begin with the letter
  const beginningExamples = LETTER_EXAMPLES.filter(ex => ex.letter_position === 'beginning')

  const startRound = (idx: number) => {
    const word = beginningExamples[(idx * 7) % beginningExamples.length]
    setTargetWord(word)

    const correctLetter = ARABIC_LETTERS.find(l => l.id === word.letter_id)?.letter || 'ب'
    const otherLetters = pickRandom(
      ARABIC_LETTERS.filter(l => l.id !== word.letter_id),
      3
    ).map(l => l.letter)

    setLetterOptions(shuffleArray([correctLetter, ...otherLetters]))
    setSelectedLetter(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (chosen: string) => {
    if (selectedLetter !== null) return
    setSelectedLetter(chosen)

    const correctLetter = ARABIC_LETTERS.find(l => l.id === targetWord.letter_id)?.letter
    const isCorrect = chosen === correctLetter

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

  const correctLetter = ARABIC_LETTERS.find(l => l.id === targetWord.letter_id)?.letter

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-brand-green flex items-center justify-center text-4xl shadow-sm">
            🎯
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter & Picture Match
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Look at the picture and select the Arabic letter its name begins with!
            </p>
          </div>
          <Button variant="success" onClick={handleStart} className="px-8 py-3.5 text-base">
            Play Picture Match! 🌟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Target Picture Card */}
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-emerald-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS} • What letter starts this word?
            </span>
            <div className="text-7xl animate-bounce-gentle select-none">
              {targetWord.emoji}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 capitalize">
                {targetWord.english_meaning}
              </h2>
              <div className="text-xs font-semibold text-gray-400">
                Arabic word: <span className="font-arabic text-base text-brand-blue font-bold" dir="rtl">{targetWord.arabic_word}</span> ({targetWord.transliteration})
              </div>
            </div>
          </div>

          {/* Letter Options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {letterOptions.map((char, idx) => {
              const isSelected = selectedLetter === char
              const isRight = char === correctLetter

              let btnClass = 'bg-white border-gray-200 hover:border-emerald-300'
              if (isSelected) {
                btnClass = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(char)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[120px] flex items-center justify-center shadow-card transition-all ${btnClass}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={isSelected ? 'text-white' : 'text-brand-blue'}
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
