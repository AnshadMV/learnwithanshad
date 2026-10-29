import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function SoundSafariGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'sound-safari',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ARABIC_LETTERS[1]) // Ba
  const [targetWord, setTargetWord] = useState(LETTER_EXAMPLES[30])
  const [options, setOptions] = useState<typeof LETTER_EXAMPLES>([])
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const startRound = (idx: number) => {
    const lettersPool = [
      ARABIC_LETTERS[0], // Alef
      ARABIC_LETTERS[1], // Ba
      ARABIC_LETTERS[2], // Ta
      ARABIC_LETTERS[4], // Jeem
      ARABIC_LETTERS[5], // Ha
      ARABIC_LETTERS[11], // Seen
    ]
    const targetL = lettersPool[idx % lettersPool.length]
    setTargetLetter(targetL)

    const correctWords = LETTER_EXAMPLES.filter(
      w => w.letter_id === targetL.id && w.letter_position === 'beginning'
    )
    const chosenCorrect = correctWords[idx % correctWords.length]
    setTargetWord(chosenCorrect)

    const distractors = pickRandom(
      LETTER_EXAMPLES.filter(w => w.letter_id !== targetL.id),
      3
    )

    setOptions(shuffleArray([chosenCorrect, ...distractors]))
    setSelectedWordId(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (word: typeof LETTER_EXAMPLES[0]) => {
    if (selectedWordId !== null) return
    setSelectedWordId(word.id)

    const isCorrect = word.letter_id === targetLetter.id

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
            🎵
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Sound Safari
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Which animal or picture begins with the requested Arabic letter sound?
            </p>
          </div>
          <Button variant="success" onClick={handleStart} className="px-8 py-3.5 text-base">
            Enter Sound Safari! 🌿
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-emerald-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-lg font-bold text-gray-700">Find the word starting with:</span>
              <span className="w-12 h-12 rounded-2xl bg-brand-green text-white font-arabic font-bold text-2xl flex items-center justify-center shadow">
                {targetLetter.letter}
              </span>
              <span className="text-sm font-extrabold text-brand-green">
                ({targetLetter.name_english})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((word, idx) => {
              const isSelected = selectedWordId === word.id
              const isRight = word.letter_id === targetLetter.id

              let btnStyle = 'bg-white border-gray-200 hover:border-emerald-300'
              if (isSelected) {
                btnStyle = isRight
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105'
                  : 'bg-rose-500 text-white border-rose-500 scale-95'
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(word)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[160px] flex flex-col items-center justify-center shadow-card transition-all ${btnStyle}`}
                >
                  <span className="text-5xl mb-2">{word.emoji}</span>
                  <ArabicText
                    size="xl"
                    weight="bold"
                    className={isSelected ? 'text-white' : 'text-gray-800'}
                  >
                    {word.arabic_word}
                  </ArabicText>
                  <span
                    className={`text-xs font-bold capitalize mt-1 ${
                      isSelected ? 'text-white/90' : 'text-gray-500'
                    }`}
                  >
                    {word.english_meaning}
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
          onHome={() => navigate('/games')}
        />
      )}
    </div>
  )
}
