import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Award, CheckCircle2 } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

export default function DailyQuestGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'daily-quest',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [questStep, setQuestStep] = useState(1) // 1 to 4
  const [todaysLetter, setTodaysLetter] = useState(ARABIC_LETTERS[0])
  const [stepOptions, setStepOptions] = useState<any[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  // Determine Today's Letter based on day of year
  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    )
    const letter = ARABIC_LETTERS[dayOfYear % ARABIC_LETTERS.length]
    setTodaysLetter(letter)
  }, [])

  const startStep = (step: number) => {
    if (step === 1) {
      // Step 1: Recognition - find letter among 4
      const others = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== todaysLetter.id),
        3
      )
      setStepOptions(shuffleArray([todaysLetter, ...others]))
    } else if (step === 2) {
      // Step 2: Form - pick isolated form
      setStepOptions(
        shuffleArray([
          todaysLetter.forms.isolated,
          todaysLetter.forms.initial,
          todaysLetter.forms.medial,
          todaysLetter.forms.final,
        ])
      )
    } else if (step === 3) {
      // Step 3: Vocabulary picture
      const matchingEx = LETTER_EXAMPLES.find(
        e => e.letter_id === todaysLetter.id && e.letter_position === 'beginning'
      ) || LETTER_EXAMPLES[0]
      const otherEx = pickRandom(
        LETTER_EXAMPLES.filter(e => e.letter_id !== todaysLetter.id),
        3
      )
      setStepOptions(shuffleArray([matchingEx, ...otherEx]))
    } else {
      // Step 4: Name match
      const others = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== todaysLetter.id),
        3
      )
      setStepOptions(shuffleArray([todaysLetter.name_english, ...others.map(o => o.name_english)]))
    }
  }

  const handleStart = () => {
    startGame()
    setQuestStep(1)
    startStep(1)
    setGameState('playing')
  }

  const handleStepAnswer = async (answer: any) => {
    let isCorrect = false

    if (questStep === 1) {
      isCorrect = answer.id === todaysLetter.id
    } else if (questStep === 2) {
      isCorrect = answer === todaysLetter.forms.isolated
    } else if (questStep === 3) {
      isCorrect = answer.letter_id === todaysLetter.id
    } else {
      isCorrect = answer === todaysLetter.name_english
    }

    if (isCorrect) {
      playCorrect()
      recordAnswer(true, 25)

      if (questStep >= 4) {
        setTimeout(async () => {
          const res = await completeGame()
          setResult(res)
          setGameState('completed')
        }, 600)
      } else {
        const next = questStep + 1
        setQuestStep(next)
        startStep(next)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-4xl shadow-sm">
            ⭐
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-600 font-extrabold text-xs uppercase mb-2">
              Daily Mission
            </div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Daily Letter Quest
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Complete today's 4-part challenge focusing on the special letter of the day!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Daily Quest! 🌟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Progress row 1-4 */}
          <div className="bg-white rounded-3xl p-4 shadow-card flex items-center justify-between">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full font-extrabold text-xs flex items-center justify-center ${
                    s < questStep
                      ? 'bg-emerald-500 text-white'
                      : s === questStep
                      ? 'bg-brand-blue text-white ring-4 ring-blue-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s < questStep ? '✓' : s}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-gray-600">
                  Step {s}
                </span>
              </div>
            ))}
          </div>

          {/* Quest Stage */}
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-pink-200">
            <h2 className="text-xl font-bold text-gray-800">
              {questStep === 1 && `Step 1: Find the letter ${todaysLetter.name_english}`}
              {questStep === 2 && `Step 2: Which is the isolated form of ${todaysLetter.name_english}?`}
              {questStep === 3 && `Step 3: Which picture begins with ${todaysLetter.letter}?`}
              {questStep === 4 && `Step 4: What is the name of this letter: ${todaysLetter.letter}?`}
            </h2>

            <div className="grid grid-cols-2 gap-4 pt-2">
              {stepOptions.map((opt, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepAnswer(opt)}
                  className="p-6 rounded-3xl border-2 border-pink-200 hover:border-pink-400 bg-white min-h-[120px] flex flex-col items-center justify-center shadow-card transition-all"
                >
                  {questStep === 1 && (
                    <ArabicText size="3xl" weight="bold" className="text-brand-blue">
                      {opt.letter}
                    </ArabicText>
                  )}
                  {questStep === 2 && (
                    <ArabicText size="3xl" weight="bold" className="text-pink-600">
                      {opt}
                    </ArabicText>
                  )}
                  {questStep === 3 && (
                    <>
                      <span className="text-5xl mb-1">{opt.emoji}</span>
                      <span className="text-sm font-bold capitalize text-gray-700">
                        {opt.english_meaning}
                      </span>
                    </>
                  )}
                  {questStep === 4 && (
                    <span className="text-xl font-black text-gray-800">{opt}</span>
                  )}
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
