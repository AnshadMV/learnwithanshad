/**
 * Sister Showdown 🥊
 *
 * Rapid-fire flashcard game: a letter flashes briefly, then the player must
 * quickly identify it from 3-5 confusable siblings. Tests dot discrimination
 * speed under pressure. Combo multiplier for consecutive correct answers.
 */
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Timer } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_GROUPS, LETTER_PEDAGOGY } from '@/data/letterPedagogy'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { shuffle } from '@/lib/utils'

const TOTAL_ROUNDS = 10
const FLASH_DURATION = 1200 // ms to show letter before hiding
const ANSWER_TIMEOUT = 4000 // ms to answer before auto-wrong

export default function SisterShowdownGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lettersParam = searchParams.get('letters')
  const presetParam = searchParams.get('preset')

  const { playCorrect, playWrong, playSparkle, playCoin } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'sister-showdown',
  })

  const [gameState, setGameState] = useState<'intro' | 'flash' | 'answer' | 'feedback' | 'completed'>('intro')
  const [round, setRound] = useState(0)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIMEOUT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Resolve letter group from URL params
  const letterGroup = useMemo(() => {
    if (presetParam) {
      const grp = LETTER_GROUPS.find(g => g.id === presetParam)
      if (grp) return grp.letterIds
    }
    if (lettersParam) {
      return lettersParam.split(',').filter(id => ARABIC_LETTERS.find(l => l.id === id))
    }
    // Default: ba / ta / tha sister group
    return ['ba', 'ta', 'tha']
  }, [presetParam, lettersParam])

  const groupLetters = useMemo(
    () => letterGroup.map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean),
    [letterGroup],
  )

  // Build rounds: random sequence of the group letters
  const rounds = useMemo(() => {
    const pool: string[] = []
    for (let i = 0; i < Math.ceil(TOTAL_ROUNDS / groupLetters.length); i++) {
      pool.push(...shuffle(groupLetters.map(l => l.id)))
    }
    return pool.slice(0, TOTAL_ROUNDS)
  }, [groupLetters])

  const currentTargetId = rounds[round]
  const currentTarget = ARABIC_LETTERS.find(l => l.id === currentTargetId)!
  const currentPed = currentTargetId ? LETTER_PEDAGOGY[currentTargetId] : null

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advanceRound = useCallback(async (correct: boolean, chosenId: string) => {
    clearTimer()
    setSelectedId(chosenId)
    setGameState('feedback')

    if (correct) {
      playCorrect()
      playCoin()
      setCombo(c => c + 1)
      recordAnswer(true, 10 + Math.min(combo, 5) * 5) // combo bonus
    } else {
      playWrong()
      setCombo(0)
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      if (round < rounds.length - 1) {
        setRound(r => r + 1)
        setSelectedId(null)
        setTimeLeft(ANSWER_TIMEOUT)
        setGameState('flash')
      } else {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      }
    }, 900)
  }, [clearTimer, combo, round, rounds.length, playCorrect, playWrong, playCoin, recordAnswer, completeGame])

  // Flash phase: show letter, then switch to answer
  useEffect(() => {
    if (gameState !== 'flash') return
    const t = setTimeout(() => setGameState('answer'), FLASH_DURATION)
    return () => clearTimeout(t)
  }, [gameState, round])

  // Answer countdown timer
  useEffect(() => {
    if (gameState !== 'answer') return
    setTimeLeft(ANSWER_TIMEOUT)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          // Time's up — auto wrong
          advanceRound(false, '')
          return 0
        }
        return t - 100
      })
    }, 100)
    return () => clearTimer()
  }, [gameState, round, clearTimer, advanceRound])

  const handleStart = () => {
    startGame()
    playSparkle()
    setRound(0)
    setCombo(0)
    setSelectedId(null)
    setGameState('flash')
  }

  const groupName = presetParam
    ? LETTER_GROUPS.find(g => g.id === presetParam)?.name
    : groupLetters.map(l => l.name_english).join(' · ')

  const getDotDisplay = (letterId: string) => {
    const ped = LETTER_PEDAGOGY[letterId]
    if (!ped || ped.dotsCount === 0) return 'No dots'
    return `${ped.dotsCount} dot${ped.dotsCount > 1 ? 's' : ''} ${ped.dotPosition}`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games/groups')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Groups</span>
        </Button>
        <div className="flex items-center gap-3">
          {combo >= 2 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-sm font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" /> {combo}x Combo!
            </motion.span>
          )}
          <span className="text-sm font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
            {round + 1} / {rounds.length}
          </span>
        </div>
      </div>

      {/* Intro */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-card text-center space-y-5 border-4 border-violet-200"
        >
          <div className="text-6xl">🥊</div>
          <h1 className="text-3xl font-black text-gray-800">Sister Showdown!</h1>
          <p className="text-gray-600 max-w-sm mx-auto">
            A letter will flash on screen for a second — then quickly tap which letter you saw! The dot count reveals the identity!
          </p>

          {/* Group preview */}
          <div className="bg-violet-50 rounded-2xl p-4 border border-violet-200">
            <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-3">Today's Sisters</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {groupLetters.map(l => (
                <div key={l.id} className="flex flex-col items-center gap-1">
                  <span className="font-arabic text-5xl text-gray-800" dir="rtl">{l.letter}</span>
                  <span className="text-xs font-bold text-gray-500">{l.name_english}</span>
                  <span className="text-[10px] text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded font-semibold">
                    {getDotDisplay(l.id)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 font-medium">
            Group: <strong className="text-gray-700">{groupName}</strong>
          </div>

          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-violet-600 hover:bg-violet-700">
            Start Showdown 🥊
          </Button>
        </motion.div>
      )}

      {/* Flash phase */}
      {gameState === 'flash' && currentTarget && (
        <motion.div
          key={`flash-${round}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          className="bg-gradient-to-br from-violet-700 to-purple-900 rounded-3xl py-16 text-center shadow-2xl border-4 border-violet-400"
        >
          <p className="text-violet-300 text-sm font-bold uppercase tracking-widest mb-4">Remember this letter!</p>
          <div
            className="font-arabic text-[10rem] leading-none text-white drop-shadow-2xl"
            dir="rtl"
            style={{ textShadow: '0 0 60px rgba(196, 181, 253, 0.8)' }}
          >
            {currentTarget.letter}
          </div>
          <p className="text-violet-400 text-sm mt-4 font-semibold animate-pulse">Memorizing...</p>
        </motion.div>
      )}

      {/* Answer phase */}
      {gameState === 'answer' && (
        <motion.div
          key={`answer-${round}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          {/* Timer bar */}
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
              style={{ width: `${(timeLeft / ANSWER_TIMEOUT) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex items-center gap-1.5 justify-center text-sm font-bold text-gray-500">
            <Timer className="w-4 h-4" />
            {(timeLeft / 1000).toFixed(1)}s to answer
          </div>

          {/* Question */}
          <div className="bg-slate-800 rounded-3xl py-10 text-center border-4 border-slate-600">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Which letter did you see?</p>
            <div className="font-arabic text-[5rem] leading-none text-slate-500 select-none" dir="rtl">
              {currentPed?.rasm || '?'}
            </div>
            <p className="text-slate-500 text-xs mt-2">(rasm without dots)</p>
          </div>

          {/* Answer buttons */}
          <div className={`grid gap-3 ${groupLetters.length <= 3 ? 'grid-cols-3' : 'grid-cols-4 sm:grid-cols-5'}`}>
            {groupLetters.map(l => (
              <motion.button
                key={l.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => advanceRound(l.id === currentTargetId, l.id)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white border-3 border-violet-200 hover:border-violet-500 hover:bg-violet-50 transition-all shadow-sm cursor-pointer"
              >
                <span className="font-arabic text-4xl text-gray-800" dir="rtl">{l.letter}</span>
                <span className="text-xs font-bold text-gray-500">{l.name_english}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feedback */}
      {gameState === 'feedback' && (
        <motion.div
          key={`feedback-${round}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl p-8 text-center border-4 ${
            selectedId === currentTargetId
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}
        >
          <div className="text-5xl mb-3">
            {selectedId === currentTargetId ? '✅' : '❌'}
          </div>
          <div className="font-arabic text-7xl text-gray-800 mb-3" dir="rtl">
            {currentTarget?.letter}
          </div>
          <p className="font-bold text-gray-700 text-lg">
            {selectedId === currentTargetId
              ? `Perfect! That's ${currentTarget?.name_english}!`
              : `It was ${currentTarget?.name_english} — ${getDotDisplay(currentTargetId)}`}
          </p>
          {combo >= 2 && selectedId === currentTargetId && (
            <p className="text-orange-600 font-black text-sm mt-2">🔥 {combo + 1}x Combo!</p>
          )}
        </motion.div>
      )}

      {/* Completed */}
      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Sister Showdown"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games/groups')}
        />
      )}
    </div>
  )
}
