import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function ListenAndMatchGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'listen-match',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetWord, setTargetWord] = useState(LETTER_EXAMPLES[0])
  const [options, setOptions] = useState<typeof LETTER_EXAMPLES>([])
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const startRound = (idx: number) => {
    const target = LETTER_EXAMPLES[(idx * 13) % LETTER_EXAMPLES.length]
    setTargetWord(target)

    const distractors = pickRandom(
      LETTER_EXAMPLES.filter(w => w.id !== target.id),
      3
    )

    setOptions(shuffleArray([target, ...distractors]))
    setSelectedWordId(null)
    setTimeout(() => speak(target.arabic_word), 300)
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

    const isCorrect = word.id === targetWord.id

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            🎤
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Listen and Match Picture
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Listen to the spoken Arabic word and tap the matching friendly picture!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Listening! 🎵
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-purple-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS} • Listen to the spoken word:
            </span>

            <button
              onClick={() => speak(targetWord.arabic_word)}
              className="w-20 h-20 mx-auto rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <div className="text-xs font-bold text-gray-400">Tap to hear word again</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((word, idx) => {
              const isSelected = selectedWordId === word.id
              const isRight = word.id === targetWord.id

              let btnStyle = 'bg-white border-gray-200 hover:border-purple-300'
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
                  <span className="text-6xl mb-2">{word.emoji}</span>
                  <span
                    className={`text-base font-extrabold capitalize ${
                      isSelected ? 'text-white' : 'text-gray-800'
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
