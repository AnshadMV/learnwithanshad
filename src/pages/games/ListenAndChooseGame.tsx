import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import { getLetterVariants, LetterVariant } from '@/data/letterVariants'
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

interface OptionItem {
  id: string
  char: string
  name: string
  isCorrect: boolean
}

export default function ListenAndChooseGame() {
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
    gameSlug: 'listen-choose',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetChar, setTargetChar] = useState('ا')
  const [targetName, setTargetName] = useState('Alef')
  const [options, setOptions] = useState<OptionItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 8

  const variants = useMemo(() => {
    if (paramLetter) {
      return getLetterVariants(paramLetter)
    }
    return []
  }, [paramLetter])

  const startRound = (idx: number) => {
    if (paramLetter && variants.length > 0) {
      // LETTER-SPECIFIC: Listen to sound/vocalizations of the target letter!
      const targetVar = variants[idx % variants.length]
      setTargetChar(targetVar.char)
      setTargetName(targetVar.name)

      // Other options: other variants of this letter
      const otherVars = variants.filter(v => v.id !== targetVar.id)
      const distractors = pickRandom(otherVars, 3)

      const combined: OptionItem[] = shuffleArray([
        { id: targetVar.id, char: targetVar.char, name: targetVar.name, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, char: d.char, name: d.name, isCorrect: false })),
      ])

      setOptions(combined)
      setSelectedId(null)
      setTimeout(() => speak(targetVar.char), 250)
    } else {
      const target = ARABIC_LETTERS[(idx * 3) % ARABIC_LETTERS.length]
      setTargetChar(target.letter)
      setTargetName(target.name_english)

      const distractors = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== target.id),
        3
      )

      const combined: OptionItem[] = shuffleArray([
        { id: target.id, char: target.letter, name: target.name_english, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, char: d.letter, name: d.name_english, isCorrect: false })),
      ])

      setOptions(combined)
      setSelectedId(null)
      setTimeout(() => speak(target.letter), 250)
    }
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleSelect = async (opt: OptionItem) => {
    if (selectedId !== null) return
    setSelectedId(opt.id)

    if (opt.isCorrect) {
      playCorrect()
      playStar()
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="listen-choose" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            🎧
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Listen & Choose
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Phonics ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Listen to the native voice audio of letter <strong>{targetLetterObj.name_english}</strong> with different vowel marks (fathah, kasrah, dammah) and tap the matching mark!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Listen to the letter sound through your speakers and choose the matching Arabic letter!
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Listening! 🔊
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Sound Prompt Card */}
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-blue-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speak(targetChar)}
              className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            >
              <Volume2 className="w-10 h-10 animate-pulse" />
            </motion.button>

            <div>
              <h2 className="text-xl font-bold text-gray-800">Tap to hear the sound again</h2>
              <p className="text-xs text-gray-400 mt-1">Which option matches the audio?</p>
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {options.map((opt, idx) => {
              const theme = getKidCardTheme(idx)
              const isSelected = selectedId === opt.id
              let btnStyle = `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
              if (isSelected) {
                btnStyle = opt.isCorrect
                  ? 'bg-emerald-500 text-white border-emerald-500 scale-105 ring-4 ring-emerald-300 shadow-xl'
                  : 'bg-rose-500 text-white border-rose-500 scale-95 shadow-md'
              }

              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  className={`p-6 rounded-3xl border-4 text-center min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-center gap-1 shadow-card transition-all cursor-pointer ${btnStyle}`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-5xl sm:text-6xl font-black ${isSelected ? 'text-white' : theme.text}`}
                  >
                    {opt.char}
                  </ArabicText>
                  <span className={`text-xs font-black truncate max-w-full ${isSelected ? 'text-white/90' : 'text-gray-700'}`}>
                    {opt.name}
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
          onHome={() => navigate(paramLetter ? `/letter/${paramLetter}` : '/games')}
        />
      )}
    </div>
  )
}
