import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function LetterShapeMatchGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'shape-match',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ARABIC_LETTERS[1])
  const [targetFormType, setTargetFormType] = useState<'initial' | 'medial' | 'final'>('initial')
  const [options, setOptions] = useState<string[]>([])
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6
  const FORM_TYPES: ('initial' | 'medial' | 'final')[] = ['initial', 'medial', 'final']

  const startRound = (idx: number) => {
    // Pick letters that connect
    const connectingLetters = ARABIC_LETTERS.filter(l => l.connects_following)
    const letter = connectingLetters[idx % connectingLetters.length]
    const formType = FORM_TYPES[idx % FORM_TYPES.length]

    setTargetLetter(letter)
    setTargetFormType(formType)

    const correctChar = letter.forms[formType]
    const otherChars = [
      letter.forms.isolated,
      formType === 'initial' ? letter.forms.final : letter.forms.initial,
      formType === 'medial' ? letter.forms.final : letter.forms.medial,
    ]

    setOptions(shuffleArray([correctChar, ...otherChars]))
    setSelectedChar(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (char: string) => {
    if (selectedChar !== null) return
    setSelectedChar(char)

    const correctChar = targetLetter.forms[targetFormType]
    const isCorrect = char === correctChar

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

  const correctChar = targetLetter.forms[targetFormType]

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
            🔷
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Shape Match
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Match how an Arabic letter changes shape when it is in the beginning, middle, or end!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Shape Match! 🎯
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-rose-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <h2 className="text-xl font-black text-gray-800 mt-2">
              Which one is the <span className="text-rose-600 uppercase font-black">{targetFormType}</span> form of{' '}
              <span className="text-brand-blue">{targetLetter.name_english}</span> ({targetLetter.letter})?
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {options.map((char, idx) => {
              const isSelected = selectedChar === char
              const isRight = char === correctChar

              let btnStyle = 'bg-white border-gray-200 hover:border-rose-300'
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
                  className={`p-6 rounded-3xl border-4 text-center min-h-[140px] flex items-center justify-center shadow-card transition-all ${btnStyle}`}
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
