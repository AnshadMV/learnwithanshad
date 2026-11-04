import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, Unlock, KeyRound, Sparkles, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import { getLetterVariants } from '@/data/letterVariants'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import ProgressBar from '@/components/ui/ProgressBar'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

interface ChestOption {
  id: string
  letter: string
  name: string
  isCorrect: boolean
}

export default function TreasureChestGame() {
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
    gameSlug: 'treasure-chest',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [unlockedLocks, setUnlockedLocks] = useState(0)
  const [targetChar, setTargetChar] = useState('ا')
  const [targetName, setTargetName] = useState('Alef')
  const [options, setOptions] = useState<ChestOption[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const TOTAL_LOCKS = 5

  const variants = useMemo(() => {
    if (paramLetter) {
      return getLetterVariants(paramLetter)
    }
    return []
  }, [paramLetter])

  const startQuestion = (lockIdx: number) => {
    if (paramLetter && variants.length > 0) {
      const v = variants[lockIdx % variants.length]
      setTargetChar(v.char)
      setTargetName(v.name)

      const otherVars = variants.filter(item => item.id !== v.id)
      const distractors = pickRandom(otherVars, 3)

      const combined: ChestOption[] = shuffleArray([
        { id: v.id, letter: v.char, name: v.name, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, letter: d.char, name: d.name, isCorrect: false })),
      ])

      setOptions(combined)
      setTimeout(() => speak(v.char), 200)
    } else {
      const target = ARABIC_LETTERS[(lockIdx * 5) % ARABIC_LETTERS.length]
      setTargetChar(target.letter)
      setTargetName(target.name_english)

      const distractors = pickRandom(
        ARABIC_LETTERS.filter(l => l.id !== target.id),
        3
      )

      const combined: ChestOption[] = shuffleArray([
        { id: target.id, letter: target.letter, name: target.name_english, isCorrect: true },
        ...distractors.map(d => ({ id: d.id, letter: d.letter, name: d.name_english, isCorrect: false })),
      ])

      setOptions(combined)
      setTimeout(() => speak(target.letter), 200)
    }
  }

  const handleStart = () => {
    startGame()
    setUnlockedLocks(0)
    startQuestion(0)
    setGameState('playing')
  }

  const handlePick = async (opt: ChestOption) => {
    playClick()
    speak(opt.letter)
    const isCorrect = opt.isCorrect

    if (isCorrect) {
      playCorrect()
      playStar()
      celebrate()
      recordAnswer(true, 15)
      const nextUnlocked = unlockedLocks + 1
      setUnlockedLocks(nextUnlocked)

      if (nextUnlocked >= TOTAL_LOCKS) {
        setTimeout(async () => {
          const res = await completeGame()
          setResult(res)
          setGameState('completed')
        }, 600)
      } else {
        startQuestion(nextUnlocked)
      }
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="treasure-chest" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-4xl shadow-sm">
            👑
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Treasure Chest Unlocker
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Treasure ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Find the matching key for letter <strong>{targetLetterObj.name_english}</strong> and its vowels to open all 5 locks of the royal chest!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                The magical golden chest has 5 mysterious locks! Match each letter to unlock the sparkling jewels inside.
              </p>
            )}
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Unlock the Chest! 🗝️
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-4 border-4 border-amber-200">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase text-gray-400">
              <span>Locks Opened: {unlockedLocks} of {TOTAL_LOCKS}</span>
              <span className="text-amber-600 flex items-center gap-1 font-bold">
                <KeyRound className="w-3.5 h-3.5" /> Golden Key
              </span>
            </div>

            <ProgressBar value={(unlockedLocks / TOTAL_LOCKS) * 100} color="bg-amber-500" />

            <div className="text-7xl sm:text-8xl select-none animate-bounce-gentle">
              {unlockedLocks >= TOTAL_LOCKS ? '💎' : '🎁'}
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-700 font-bold text-base">Current Lock requires:</span>
              <span className="min-w-14 px-3 h-14 rounded-2xl bg-amber-500 text-white font-arabic font-bold text-3xl flex items-center justify-center shadow">
                {targetChar}
              </span>
              <button
                onClick={() => speak(targetChar)}
                className="p-2.5 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 font-bold">{targetName}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {options.map((opt, idx) => {
              const theme = getKidCardTheme(idx)
              return (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePick(opt)}
                  className={`p-6 rounded-3xl border-4 ${theme.border} ${theme.bg} ${theme.hoverBorder} ${theme.hoverBg} text-center shadow-card transition-all cursor-pointer flex flex-col items-center justify-center gap-1 min-h-[140px] sm:min-h-[160px]`}
                >
                  <ArabicText size="3xl" weight="bold" className={`text-5xl sm:text-6xl font-black ${theme.text}`}>
                    {opt.letter}
                  </ArabicText>
                  <span className="text-xs font-black text-gray-700 truncate max-w-full">
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
