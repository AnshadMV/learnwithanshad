/**
 * Dot Placement Workshop 🔵
 *
 * Unique I'jam mechanic: Children drag glowing dots onto the correct positions
 * on a naked letter rasm body. Tests understanding of dot count and position.
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, RotateCcw } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_PEDAGOGY, getConfusableDistractors } from '@/data/letterPedagogy'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { shuffle } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DotSlot {
  id: string
  label: string
  position: 'above-left' | 'above-center' | 'above-right' | 'below-center' | 'inside'
}

interface Round {
  targetId: string
  rasm: string
  targetDotCount: number
  targetDotPosition: string
  targetLetter: string
  targetName: string
  // Competing options: all share this rasm but differ in dots
  siblings: { id: string; letter: string; name: string; dotsCount: number; dotPosition: string }[]
}

// ---------------------------------------------------------------------------
// Dot slot definitions (visual positions on the letter body)
// ---------------------------------------------------------------------------

const DOT_SLOTS: DotSlot[] = [
  { id: 'above-left',   label: '↖ Above-Left',   position: 'above-left' },
  { id: 'above-center', label: '⬆ Above-Center',  position: 'above-center' },
  { id: 'above-right',  label: '↗ Above-Right',   position: 'above-right' },
  { id: 'below-center', label: '⬇ Below-Center',  position: 'below-center' },
  { id: 'inside',       label: '⬤ Inside',        position: 'inside' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DotPlacementGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')
  const { playCorrect, playWrong, playSparkle } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'dot-placement',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Build rounds using confusable letter clusters
  const rounds = useMemo<Round[]>(() => {
    const targetLetter = paramLetter
      ? ARABIC_LETTERS.find(l => l.id === paramLetter)
      : null

    // Get the rasm-family cluster for target, or pick varied clusters
    const clusters: string[][] = targetLetter
      ? [
          // All rounds in letter-scope mode focus on confusables of target
          [targetLetter.id, ...getConfusableDistractors(targetLetter.id, 4).slice(0, 2)],
          [targetLetter.id, ...getConfusableDistractors(targetLetter.id, 4).slice(0, 2)],
          [targetLetter.id, ...getConfusableDistractors(targetLetter.id, 4).slice(0, 2)],
          [targetLetter.id, ...getConfusableDistractors(targetLetter.id, 4).slice(0, 2)],
          [targetLetter.id, ...getConfusableDistractors(targetLetter.id, 4).slice(0, 2)],
        ]
      : [
          ['ba', 'ta', 'tha'],
          ['jeem', 'ha', 'kha'],
          ['dal', 'dhal'],
          ['ra', 'zayn'],
          ['seen', 'sheen'],
        ]

    return clusters.map((cluster, i) => {
      const shuffled = shuffle([...cluster])
      const targetId = targetLetter ? targetLetter.id : shuffled[0]
      const target = ARABIC_LETTERS.find(l => l.id === targetId)!
      const ped = LETTER_PEDAGOGY[targetId]

      const siblings = shuffled.map(id => {
        const l = ARABIC_LETTERS.find(l2 => l2.id === id)!
        const p = LETTER_PEDAGOGY[id]
        return {
          id,
          letter: l.letter,
          name: l.name_english,
          dotsCount: p?.dotsCount ?? 0,
          dotPosition: p?.dotPosition ?? 'none',
        }
      })

      return {
        targetId,
        rasm: ped?.rasm ?? target.letter,
        targetDotCount: ped?.dotsCount ?? 0,
        targetDotPosition: ped?.dotPosition ?? 'none',
        targetLetter: target.letter,
        targetName: target.name_english,
        siblings,
      }
    })
  }, [paramLetter])

  const current = rounds[round] || rounds[0]

  const handleStart = () => {
    startGame()
    playSparkle()
    setRound(0)
    setFeedback(null)
    setSelectedOption(null)
    setGameState('playing')
  }

  const handleChooseLetter = useCallback(async (chosenId: string) => {
    if (feedback) return // prevent double tap
    setSelectedOption(chosenId)

    if (chosenId === current.targetId) {
      setFeedback('correct')
      playCorrect()
      recordAnswer(true, 20)
    } else {
      setFeedback('wrong')
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      setFeedback(null)
      setSelectedOption(null)
      if (round < rounds.length - 1) {
        setRound(r => r + 1)
      } else {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      }
    }, 1100)
  }, [feedback, current, round, rounds.length, playCorrect, playWrong, recordAnswer, completeGame])

  const renderDotPattern = (count: number, position: string) => {
    if (count === 0) return null
    const dots = Array.from({ length: count }, (_, i) => (
      <span key={i} className="inline-block w-3 h-3 rounded-full bg-current" />
    ))
    return (
      <div className={`flex gap-1 justify-center ${
        position === 'below-center' ? 'mt-1' : 'mb-1'
      }`}>
        {dots}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Arcade</span>
        </Button>
        <span className="text-sm font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
          Round {round + 1} / {rounds.length}
        </span>
      </div>

      {/* Letter-scope badge */}
      {paramLetter && (
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <span>🎯</span>
          <span>Letter-Specific Mode: <span className="font-arabic text-lg ml-1" dir="rtl">{current.targetLetter}</span> ({current.targetName})</span>
        </div>
      )}

      {/* Intro */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-card text-center space-y-5 border-4 border-violet-200"
        >
          <div className="text-6xl">⚫</div>
          <h1 className="text-3xl font-black text-gray-800">Dot Placement Workshop</h1>
          <p className="text-gray-600 max-w-sm mx-auto">
            A naked letter body (rasm) will appear without its dots. Choose which Arabic letter it becomes by picking the option with the correct dot count and position!
          </p>
          <div className="bg-violet-50 rounded-2xl p-4 text-sm text-violet-700 font-semibold border border-violet-200">
            💡 In Arabic, dots (I'jam / نقاط) are essential — they change the letter completely!
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-violet-600 hover:bg-violet-700">
            Start Workshop ⚫
          </Button>
        </motion.div>
      )}

      {/* Playing */}
      {gameState === 'playing' && (
        <motion.div key={round} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {/* Rasm display */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-10 text-center shadow-xl border-4 border-violet-500 relative overflow-hidden">
            {/* Decorative dots scattered */}
            {['top-4 left-6', 'top-8 right-10', 'bottom-4 right-6'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-violet-400/40`} />
            ))}
            <p className="text-violet-300 font-bold uppercase tracking-wider text-xs mb-3">
              What letter does this rasm become?
            </p>
            <div
              className="text-[9rem] font-black font-arabic leading-none text-white drop-shadow-2xl"
              dir="rtl"
              style={{ textShadow: '0 0 40px rgba(167, 139, 250, 0.5)' }}
            >
              {current.rasm}
            </div>
            <p className="text-slate-400 text-sm mt-3 font-semibold">
              ← This is the naked body (rasm). Pick the right letter below!
            </p>
          </div>

          {/* Options */}
          <div className={`grid gap-4 ${current.siblings.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {current.siblings.map(sib => {
              const isSelected = selectedOption === sib.id
              const isTarget = sib.id === current.targetId
              const isCorrectSelected = feedback === 'correct' && isSelected
              const isWrongSelected = feedback === 'wrong' && isSelected
              const isReveal = feedback === 'wrong' && isTarget

              return (
                <motion.button
                  key={sib.id}
                  whileHover={!feedback ? { scale: 1.05 } : {}}
                  whileTap={!feedback ? { scale: 0.95 } : {}}
                  onClick={() => handleChooseLetter(sib.id)}
                  className={`
                    relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-4 font-bold text-center transition-all shadow-md
                    ${isCorrectSelected ? 'border-green-500 bg-green-50 scale-105' : ''}
                    ${isWrongSelected ? 'border-red-400 bg-red-50' : ''}
                    ${isReveal ? 'border-green-400 bg-green-50 opacity-90' : ''}
                    ${!isSelected && !isReveal ? 'border-violet-200 bg-white hover:border-violet-500 hover:bg-violet-50 cursor-pointer' : ''}
                  `}
                >
                  {/* Dot pattern above */}
                  {sib.dotPosition !== 'below-center' && (
                    <div className="text-violet-500">
                      {renderDotPattern(sib.dotsCount, sib.dotPosition)}
                    </div>
                  )}

                  {/* Letter */}
                  <span className="font-arabic text-5xl text-gray-800" dir="rtl">
                    {sib.letter}
                  </span>

                  {/* Dot pattern below */}
                  {sib.dotPosition === 'below-center' && (
                    <div className="text-violet-500">
                      {renderDotPattern(sib.dotsCount, sib.dotPosition)}
                    </div>
                  )}

                  <span className="text-xs text-gray-500 font-semibold">{sib.name}</span>

                  {/* Dot count chip */}
                  <span className="text-[10px] bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-bold">
                    {sib.dotsCount === 0 ? 'No dots' : `${sib.dotsCount} dot${sib.dotsCount > 1 ? 's' : ''} ${sib.dotPosition}`}
                  </span>

                  {isCorrectSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow">
                      ✓
                    </motion.div>
                  )}
                  {isWrongSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow">
                      ✗
                    </motion.div>
                  )}
                  {isReveal && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow">
                      ★
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-2xl font-black text-lg ${
                  feedback === 'correct'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {feedback === 'correct'
                  ? '✅ Excellent! You placed the dots correctly!'
                  : `❌ Oops! The correct letter was: ${current.targetName} (${current.targetDotCount} dot${current.targetDotCount !== 1 ? 's' : ''} ${current.targetDotPosition})`}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Completed */}
      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Dot Placement Workshop"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games')}
        />
      )}
    </div>
  )
}
