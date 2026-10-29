import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function ListenAndChooseGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'listen-choose',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ARABIC_LETTERS[0])
  const [options, setOptions] = useState<LetterData[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  const startRound = (idx: number) => {
    const target = ARABIC_LETTERS[(idx * 3) % ARABIC_LETTERS.length]
    setTargetLetter(target)

    const distractors = pickRandom(
      ARABIC_LETTERS.filter(l => l.id !== target.id),
      3
    )

    setOptions(shuffleArray([target, ...distractors]))
    setSelectedId(null)
    setTimeout(() => speak(target.letter), 200)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (chosen: LetterData) => {
    if (selectedId !== null) return
    setSelectedId(chosen.id)

    const isCorrect = chosen.id === targetLetter.id

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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            👂
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Listen and Choose
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Listen to the authentic Arabic letter sound and pick which letter matches it!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Listening! 🎵
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-blue-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS} • Listen closely:
            </span>

            <button
              onClick={() => speak(targetLetter.letter)}
              className="w-24 h-24 mx-auto rounded-full bg-brand-blue text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
              <Volume2 className="w-12 h-12" />
            </button>
            <div className="text-xs font-bold text-gray-400">
              Tap the speaker to replay the sound
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {options.map((letter, idx) => {
              const isSelected = selectedId === letter.id
              const isRight = letter.id === targetLetter.id

              let btnStyle = 'bg-white border-gray-200 hover:border-blue-300'
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
                  onClick={() => handleSelect(letter)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[140px] flex items-center justify-center shadow-card transition-all ${btnStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={isSelected ? 'text-white' : 'text-brand-blue'}
                  >
                    {letter.letter}
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
