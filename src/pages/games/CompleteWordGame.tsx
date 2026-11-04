import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { shuffleArray, pickRandom } from '@/lib/utils'

interface WordQuestion {
  displayWord: string
  fullWord: string
  missingChar: string
  options: string[]
  english: string
  emoji: string
}

const DEFAULT_QUESTIONS: WordQuestion[] = [
  {
    displayWord: 'بَـ_ـت',
    fullWord: 'بَيْت',
    missingChar: 'ي',
    options: ['ي', 'س', 'ن', 'ر'],
    english: 'House (Bayt)',
    emoji: '🏠',
  },
  {
    displayWord: 'كِـ_ـاب',
    fullWord: 'كِتَاب',
    missingChar: 'ت',
    options: ['ت', 'ب', 'م', 'د'],
    english: 'Book (Kitāb)',
    emoji: '📖',
  },
  {
    displayWord: 'أَ_ـد',
    fullWord: 'أَسَد',
    missingChar: 'س',
    options: ['س', 'ش', 'ص', 'ج'],
    english: 'Lion (Asad)',
    emoji: '🦁',
  },
  {
    displayWord: 'شَـ_ـس',
    fullWord: 'شَمْس',
    missingChar: 'م',
    options: ['م', 'ن', 'ل', 'ك'],
    english: 'Sun (Shams)',
    emoji: '☀️',
  },
  {
    displayWord: 'قَـ_ـر',
    fullWord: 'قَمَر',
    missingChar: 'م',
    options: ['م', 'و', 'ب', 'ف'],
    english: 'Moon (Qamar)',
    emoji: '🌙',
  },
  {
    displayWord: 'بَـ_ـة',
    fullWord: 'بَطَّة',
    missingChar: 'ط',
    options: ['ط', 'ظ', 'ص', 'ت'],
    english: 'Duck (Baṭṭah)',
    emoji: '🦆',
  },
]

export default function CompleteWordGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playStar } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'complete-word',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedChar, setSelectedChar] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const questions: WordQuestion[] = useMemo(() => {
    if (paramLetter) {
      const examples = LETTER_EXAMPLES.filter(ex => ex.letter_id === paramLetter)
      if (examples.length > 0) {
        return examples.slice(0, 6).map(ex => {
          const word = ex.arabic_word
          const targetChar = targetLetterObj?.letter || 'ا'
          // Create blank where letter appears
          let displayWord = word.replace(targetChar, '_')
          if (displayWord === word && word.length > 0) {
            displayWord = '_' + word.slice(1)
          }

          const distractors = pickRandom(
            ARABIC_LETTERS.filter(l => l.id !== paramLetter),
            3
          ).map(l => l.letter)

          return {
            displayWord,
            fullWord: word,
            missingChar: targetChar,
            options: shuffleArray([targetChar, ...distractors]),
            english: `${ex.english_meaning} (${ex.transliteration})`,
            emoji: ex.emoji,
          }
        })
      }
    }
    return DEFAULT_QUESTIONS
  }, [paramLetter, targetLetterObj])

  const currentQ = questions[currentIdx % questions.length]

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
      playStar()
      celebrate()
      recordAnswer(true, 15)
      speak(currentQ.fullWord)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (currentIdx + 1 >= questions.length) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        const next = currentIdx + 1
        setCurrentIdx(next)
        setSelectedChar(null)
      }
    }, 1200)
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="complete-word" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center text-4xl shadow-sm">
            📝
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Complete the Word
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Words ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Fill in the missing letter <strong>{targetLetterObj.name_english}</strong> to complete each illustrated Arabic word!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Look at the picture clue and choose the missing Arabic letter to complete the puzzle word!
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Word Building! 🧩
          </Button>
        </div>
      )}

      {gameState === 'playing' && currentQ && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-purple-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Word {currentIdx + 1} of {questions.length}
            </span>

            <div className="text-7xl sm:text-8xl select-none animate-bounce-gentle">
              {currentQ.emoji}
            </div>

            <div className="my-4">
              <ArabicText size="3xl" weight="bold" className="text-gray-800 tracking-wider">
                {selectedChar === currentQ.missingChar
                  ? currentQ.fullWord
                  : currentQ.displayWord}
              </ArabicText>
              <p className="text-sm font-bold text-gray-500 mt-2">{currentQ.english}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {currentQ.options.map((char, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedChar === char
              const isRight = char === currentQ.missingChar

              let btnStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                btnStyle = isRight
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
