import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterVariants } from '@/data/letterVariants'
import { getConfusableDistractors } from '@/data/letterPedagogy'
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
import { pickRandom, shuffleArray } from '@/lib/utils'

interface Fish {
  id: number
  letter: string
  color: string
}

const FISH_COLORS = ['bg-amber-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-rose-400', 'bg-purple-400']

export default function LetterFishingGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playClick, playStar } = useSound()
  const { celebrate } = useConfetti()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-fishing',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentRound, setCurrentRound] = useState(0)
  const [targetChar, setTargetChar] = useState('ج')
  const [targetName, setTargetName] = useState('Jeem')
  const [fishes, setFishes] = useState<Fish[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_ROUNDS = 6

  const variants = useMemo(() => {
    if (paramLetter) {
      return getLetterVariants(paramLetter)
    }
    return []
  }, [paramLetter])

  const startRound = (idx: number) => {
    let target = 'ج'
    let name = 'Jeem'

    if (paramLetter && variants.length > 0) {
      const v = variants[idx % variants.length]
      target = v.char
      name = v.name

      const confusableIds = getConfusableDistractors(paramLetter, 4)
      const distractors = confusableIds.length >= 2
        ? confusableIds.map(id => getLetterById(id)?.letter).filter(Boolean) as string[]
        : ARABIC_LETTERS.filter(l => l.id !== paramLetter).slice(0, 4).map(l => l.letter)

      const list: Fish[] = [
        { id: 1, letter: target, color: FISH_COLORS[0] },
        { id: 2, letter: distractors[0] || 'ب', color: FISH_COLORS[1] },
        { id: 3, letter: distractors[1] || 'ت', color: FISH_COLORS[2] },
        { id: 4, letter: distractors[2] || 'ث', color: FISH_COLORS[3] },
        { id: 5, letter: distractors[3] || 'ن', color: FISH_COLORS[4] },
      ]

      setFishes(shuffleArray(list))
    } else {
      const l = ARABIC_LETTERS[(idx * 4) % ARABIC_LETTERS.length]
      target = l.letter
      name = l.name_english

      const others = pickRandom(
        ARABIC_LETTERS.filter(item => item.letter !== target),
        4
      ).map(item => item.letter)

      const list: Fish[] = [
        { id: 1, letter: target, color: FISH_COLORS[0] },
        { id: 2, letter: others[0], color: FISH_COLORS[1] },
        { id: 3, letter: others[1], color: FISH_COLORS[2] },
        { id: 4, letter: others[2], color: FISH_COLORS[3] },
        { id: 5, letter: others[3], color: FISH_COLORS[4] },
      ]

      setFishes(shuffleArray(list))
    }

    setTargetChar(target)
    setTargetName(name)
    setTimeout(() => speak(target), 200)
  }

  const handleStart = () => {
    startGame()
    setCurrentRound(0)
    startRound(0)
    setGameState('playing')
  }

  const handleCatchFish = async (fish: Fish) => {
    playClick()
    speak(fish.letter)
    const isTarget = fish.letter === targetChar

    if (isTarget) {
      playCorrect()
      playStar()
      celebrate()
      recordAnswer(true, 15)

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
      }, 700)
    } else {
      playWrong()
      recordAnswer(false, 0)
    }
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="letter-fishing" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-100 text-cyan-600 flex items-center justify-center text-4xl shadow-sm">
            🎣
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Letter Fishing
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Fishing for Letter {targetLetterObj.name_english} ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Catch the fish carrying the right form or vowel mark of <strong>{targetLetterObj.name_english}</strong>!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Cast your line into the calm blue pond and catch the fish carrying the target letter!
              </p>
            )}
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Go Fishing! 🐟
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-cyan-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Round {currentRound + 1} of {TOTAL_ROUNDS}
            </span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-lg font-bold text-gray-700">Catch the fish with:</span>
              <span className="min-w-14 px-3 h-14 rounded-2xl bg-cyan-600 text-white font-arabic font-bold text-3xl flex items-center justify-center shadow">
                {targetChar}
              </span>
              <button
                onClick={() => speak(targetChar)}
                className="p-2.5 rounded-xl bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                title="Hear sound"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-bold">{targetName}</p>
          </div>

          <div className="bg-gradient-to-b from-cyan-400 via-sky to-blue-500 rounded-3xl p-8 sm:p-12 shadow-2xl min-h-[300px] flex items-center justify-center relative overflow-hidden border-4 border-cyan-300">
            <div className="absolute top-4 right-6 text-white/30 text-6xl pointer-events-none select-none">
              🌊
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 z-10">
              {fishes.map((fish, idx) => {
                const theme = getKidCardTheme(idx)
                return (
                  <motion.button
                    key={fish.id}
                    whileHover={{ scale: 1.15, y: -6 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.2 + (fish.id % 3) * 0.4 }}
                    onClick={() => handleCatchFish(fish)}
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${theme.gradient} text-white shadow-2xl flex flex-col items-center justify-center border-4 border-white cursor-pointer select-none ring-4 ring-white/40`}
                  >
                    <ArabicText size="3xl" weight="bold" className="text-5xl sm:text-6xl font-black drop-shadow">
                      {fish.letter}
                    </ArabicText>
                  </motion.button>
                )
              })}
            </div>
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
