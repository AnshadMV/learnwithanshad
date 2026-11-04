import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

export default function LetterShapeMatchGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong } = useSound()
  const { celebrate } = useConfetti()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'shape-match',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetLetter, setTargetLetter] = useState<LetterData>(ARABIC_LETTERS[1])
  const [targetFormType, setTargetFormType] = useState<'isolated' | 'initial' | 'medial' | 'final'>('initial')
  const [options, setOptions] = useState<string[]>([])
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6
  const ALL_FORM_TYPES: ('isolated' | 'initial' | 'medial' | 'final')[] = ['isolated', 'initial', 'medial', 'final']

  const startRound = (idx: number) => {
    const letter = targetLetterObj || ARABIC_LETTERS.filter(l => l.connects_following)[idx % 18]
    const formType = ALL_FORM_TYPES[idx % ALL_FORM_TYPES.length]

    setTargetLetter(letter)
    setTargetFormType(formType)

    const correctChar = letter.forms[formType]
    // Get other distinct forms of this letter, or other letters if needed
    const otherForms = ALL_FORM_TYPES.filter(t => t !== formType).map(t => letter.forms[t])
    const uniqueOthers = [...new Set(otherForms.filter(c => c !== correctChar))]

    while (uniqueOthers.length < 3) {
      const randomOther = pickRandom(ARABIC_LETTERS.filter(l => l.id !== letter.id), 1)[0]
      uniqueOthers.push(randomOther.forms.isolated)
    }

    setOptions(shuffleArray([correctChar, ...uniqueOthers.slice(0, 3)]))
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
      celebrate()
      recordAnswer(true, 15)
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

  const FORM_LABELS: Record<string, string> = {
    isolated: 'Isolated Form (Stand-alone)',
    initial: 'Initial Form (Beginning of word)',
    medial: 'Medial Form (Middle of word)',
    final: 'Final Form (End of word)',
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="shape-match" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-100 text-red-600 flex items-center justify-center text-4xl shadow-sm">
            🔷
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Shape Match
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Shapes ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Master the 4 connection positions of letter <strong>{targetLetterObj.name_english}</strong>: isolated, initial, medial, and final!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Arabic letters change their shape depending on where they sit in a word. Match the right shape!
              </p>
            )}
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Shape Matching! 🔷
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-rose-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>

            <div>
              <p className="text-sm font-bold text-gray-500">Find the shape of:</p>
              <div className="flex items-center justify-center gap-3 my-2">
                <ArabicText size="3xl" weight="bold" className="text-brand-blue">
                  {targetLetter.letter}
                </ArabicText>
                <span className="text-xl font-black text-gray-800">({targetLetter.name_english})</span>
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 font-bold text-sm">
                Position: {FORM_LABELS[targetFormType]}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {options.map((char, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedChar === char
              const correctChar = targetLetter.forms[targetFormType]
              const isCorrect = char === correctChar

              let btnStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                btnStyle = isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 ring-4 ring-emerald-300 shadow-xl'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(char)}
                  className={`p-6 rounded-3xl border-4 text-center shadow-card transition-all cursor-pointer min-h-[130px] sm:min-h-[150px] flex items-center justify-center ${btnStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-5xl sm:text-6xl font-black ${isSelected ? 'text-white' : theme.text}`}
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
          onHome={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
        />
      )}
    </div>
  )
}
