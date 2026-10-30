/**
 * Alphabet Train Sequencer 🚃
 *
 * Multi-letter sequencing game: The child arranges 3, 4, or 5 scrambled
 * letters into their correct alphabetical sequence to couple the train
 * and dispatch it down the line.
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, Check, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_GROUPS } from '@/data/letterPedagogy'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { shuffle } from '@/lib/utils'

export default function TrainSequencerGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lettersParam = searchParams.get('letters')
  const presetParam = searchParams.get('preset')

  const { playCorrect, playWrong, playSparkle, playCoin } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'train-sequencer',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [placedCars, setPlacedCars] = useState<string[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  // Resolve target letters (3 to 5 letters)
  const activeLetters = useMemo(() => {
    if (presetParam) {
      const grp = LETTER_GROUPS.find(g => g.id === presetParam)
      if (grp) return grp.letterIds.map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
    }
    if (lettersParam) {
      const ids = lettersParam.split(',')
      const matched = ids.map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
      if (matched.length >= 3) return matched.slice(0, 5)
    }
    // Default group: alef, baa, taa
    return ['alef', 'ba', 'ta'].map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
  }, [presetParam, lettersParam])

  // Sort active letters by their natural Arabic order index (canonical order)
  const sortedLetters = useMemo(() => {
    return [...activeLetters].sort((a, b) => a.order_index - b.order_index)
  }, [activeLetters])

  // Pool of scrambled unplaced letters for this round
  const availableLetters = useMemo(() => {
    return sortedLetters.filter(l => !placedCars.includes(l.id))
  }, [sortedLetters, placedCars])

  const handleStart = () => {
    startGame()
    playSparkle()
    setRound(0)
    setPlacedCars([])
    setFeedback(null)
    setGameState('playing')
  }

  const handlePlaceLetter = (letterId: string) => {
    if (feedback) return
    playCoin()
    setPlacedCars(prev => [...prev, letterId])
  }

  const handleRemoveCar = (letterId: string) => {
    if (feedback) return
    setPlacedCars(prev => prev.filter(id => id !== letterId))
  }

  const handleCheckTrain = useCallback(async () => {
    if (placedCars.length !== sortedLetters.length || feedback) return

    // Verify order
    const isCorrect = placedCars.every((id, idx) => id === sortedLetters[idx].id)

    if (isCorrect) {
      setFeedback('correct')
      playCorrect()
      playSparkle()
      recordAnswer(true, 25)
    } else {
      setFeedback('wrong')
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (isCorrect) {
        if (round < 2) { // 3 rounds total
          setRound(r => r + 1)
          setPlacedCars([])
          setFeedback(null)
        } else {
          const res = await completeGame()
          setResult(res)
          setGameState('completed')
        }
      } else {
        // Reset cars to try again
        setPlacedCars([])
        setFeedback(null)
      }
    }, 1200)
  }, [placedCars, sortedLetters, feedback, round, playCorrect, playSparkle, playWrong, recordAnswer, completeGame])

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games/groups')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Letter Groups</span>
        </Button>
        <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full">
          Train Mission: {round + 1} / 3
        </span>
      </div>

      {/* Intro */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-card text-center space-y-5 border-4 border-red-200"
        >
          <div className="text-6xl animate-bounce-gentle">🚂</div>
          <h1 className="text-3xl font-black text-gray-800">Alphabet Train Sequencer</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            The Arabic express train is getting ready for departure! Tap the letter cars in their correct alphabetical order to couple them behind the locomotive.
          </p>

          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Group Letters to Sequence</p>
            <div className="flex justify-center gap-3 flex-wrap">
              {sortedLetters.map(l => (
                <div key={l.id} className="bg-white border-2 border-red-200 rounded-xl px-3 py-2 text-center">
                  <span className="font-arabic text-3xl text-gray-800" dir="rtl">{l.letter}</span>
                  <div className="text-[10px] text-gray-500 font-bold">#{l.order_index} {l.name_english}</div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-red-600 hover:bg-red-700">
            Coupling Station 🚂
          </Button>
        </motion.div>
      )}

      {/* Playing */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Railway Tracks & Train Container */}
          <div className="bg-gradient-to-b from-sky-100 to-amber-50 rounded-3xl p-6 border-4 border-amber-200 shadow-lg relative overflow-hidden">
            <div className="text-center mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-3 py-1 rounded-full">
                Couple cars right-to-left (Arabic order: 1 → 2 → 3)
              </span>
            </div>

            {/* Train and cars row */}
            <div className="flex items-end justify-center gap-2 overflow-x-auto pb-4 pt-2" dir="rtl">
              {/* Locomotive */}
              <div className="shrink-0 flex flex-col items-center">
                <span className="text-5xl">🚂</span>
                <span className="text-[10px] font-bold text-gray-600">Engine</span>
              </div>

              {/* Placed cars slots */}
              {sortedLetters.map((_, idx) => {
                const letterId = placedCars[idx]
                const placedLetter = letterId ? ARABIC_LETTERS.find(l => l.id === letterId) : null

                return (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-gray-400 font-bold text-lg select-none">🔗</span>
                    <div
                      onClick={() => letterId && handleRemoveCar(letterId)}
                      className={`
                        w-16 h-20 rounded-2xl border-3 flex flex-col items-center justify-center transition-all cursor-pointer select-none
                        ${placedLetter
                          ? 'bg-red-500 border-red-600 text-white shadow-md scale-105 hover:bg-red-600'
                          : 'bg-white/60 border-dashed border-gray-300 text-gray-400'}
                      `}
                    >
                      {placedLetter ? (
                        <>
                          <span className="font-arabic text-3xl font-black leading-none drop-shadow" dir="rtl">
                            {placedLetter.letter}
                          </span>
                          <span className="text-[9px] font-bold text-red-100 mt-1">
                            {placedLetter.name_english}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-bold">Car #{idx + 1}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Railway track lines */}
            <div className="h-3 bg-stone-700 rounded-full flex justify-between px-4 mt-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-1.5 h-full bg-stone-500" />
              ))}
            </div>
          </div>

          {/* Scrambled Available Letters */}
          <div className="bg-white rounded-3xl p-6 shadow-card border-2 border-gray-100 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
              Tap cars in order to couple to the train:
            </p>

            <div className="flex justify-center gap-3 flex-wrap">
              {availableLetters.map(l => (
                <motion.button
                  key={l.id}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handlePlaceLetter(l.id)}
                  className="bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 border-3 border-amber-600 rounded-2xl w-20 h-24 flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg transition-all"
                >
                  <span className="font-arabic text-4xl font-black" dir="rtl">{l.letter}</span>
                  <span className="text-xs font-bold">{l.name_english}</span>
                </motion.button>
              ))}
            </div>

            {availableLetters.length === 0 && placedCars.length === sortedLetters.length && (
              <div className="text-center pt-2">
                <Button
                  variant="primary"
                  onClick={handleCheckTrain}
                  className="px-8 py-3 font-bold bg-green-600 hover:bg-green-700 shadow-md text-base"
                >
                  <Check className="w-5 h-5 mr-1" /> Dispatch Train! 🚀
                </Button>
              </div>
            )}
          </div>

          {/* Feedback message */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-2xl font-black text-base ${
                  feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback === 'correct'
                  ? '🚂 Toot toot! Perfect alphabetical sequence!'
                  : '❌ Cars were in the wrong order! Try coupling again in Arabic order.'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Completed */}
      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Alphabet Train Sequencer"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games/groups')}
        />
      )}
    </div>
  )
}
