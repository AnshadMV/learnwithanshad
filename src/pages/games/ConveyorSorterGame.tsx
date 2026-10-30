/**
 * Conveyor Belt Sorter 📦
 *
 * Multi-letter sorting game: items (vocabulary words or letter tokens)
 * appear on a conveyor belt. The child must route/sort each item into the
 * correct letter chute (among 3-5 selected group letters).
 */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Box, CheckCircle2, XCircle } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_GROUPS } from '@/data/letterPedagogy'
import { LETTER_EXAMPLES } from '@/data/letterExamples'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { shuffle } from '@/lib/utils'

interface SortItem {
  id: string
  targetLetterId: string
  arabicText: string
  englishText: string
  imageEmoji: string
  type: 'word' | 'letter'
}

const CHUTE_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
  { bg: 'bg-rose-500', light: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-700' },
]

export default function ConveyorSorterGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lettersParam = searchParams.get('letters')
  const presetParam = searchParams.get('preset')

  const { playCorrect, playWrong, playSparkle, playCoin } = useSound()
  const { recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'conveyor-sorter',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [selectedChute, setSelectedChute] = useState<string | null>(null)
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
    // Default group: baa, taa, thaa
    return ['ba', 'ta', 'tha'].map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
  }, [presetParam, lettersParam])

  // Build items list from examples of the selected letters
  const items = useMemo<SortItem[]>(() => {
    const list: SortItem[] = []
    activeLetters.forEach(letter => {
      // Find examples starting with this letter
      const examples = (LETTER_EXAMPLES as any)[letter.id] || []
      const beginningExamples = examples.filter((ex: any) => ex.position === 'beginning').slice(0, 3)

      beginningExamples.forEach((ex: any, idx: number) => {
        list.push({
          id: `${letter.id}-${idx}`,
          targetLetterId: letter.id,
          arabicText: ex.word_arabic,
          englishText: ex.word_english,
          imageEmoji: ex.image_emoji || '📦',
          type: 'word',
        })
      })

      // Also add isolated letter card
      list.push({
        id: `${letter.id}-card`,
        targetLetterId: letter.id,
        arabicText: letter.letter,
        englishText: letter.name_english,
        imageEmoji: '🔤',
        type: 'letter',
      })
    })

    return shuffle(list).slice(0, 8)
  }, [activeLetters])

  const currentItem = items[currentIndex] || items[0]

  const handleStart = () => {
    startGame()
    playSparkle()
    setCurrentIndex(0)
    setFeedback(null)
    setSelectedChute(null)
    setGameState('playing')
  }

  const handleSortIntoChute = useCallback(async (letterId: string) => {
    if (feedback) return
    setSelectedChute(letterId)

    const isMatch = letterId === currentItem.targetLetterId

    if (isMatch) {
      setFeedback('correct')
      playCorrect()
      playCoin()
      recordAnswer(true, 15)
    } else {
      setFeedback('wrong')
      playWrong()
      recordAnswer(false, 0)
    }

    setTimeout(async () => {
      setFeedback(null)
      setSelectedChute(null)

      if (currentIndex < items.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      }
    }, 900)
  }, [feedback, currentItem, currentIndex, items.length, playCorrect, playWrong, playCoin, recordAnswer, completeGame])

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games/groups')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Letter Groups</span>
        </Button>
        <span className="text-sm font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
          Cargo Item: {currentIndex + 1} / {items.length}
        </span>
      </div>

      {/* Intro */}
      {gameState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-card text-center space-y-5 border-4 border-teal-200"
        >
          <div className="text-6xl animate-bounce-gentle">📦</div>
          <h1 className="text-3xl font-black text-gray-800">Conveyor Belt Sorter</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Cargo crates are arriving at the factory! Inspect each crate and route it down the chute for the matching Arabic letter.
          </p>

          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-200">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Sorting Chutes for this Group</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {activeLetters.map((l, i) => (
                <div key={l.id} className="flex flex-col items-center">
                  <span className="font-arabic text-4xl text-gray-800" dir="rtl">{l.letter}</span>
                  <span className="text-xs font-bold text-gray-500">{l.name_english}</span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base font-bold bg-teal-600 hover:bg-teal-700">
            Start Sorting Factory 🏭
          </Button>
        </motion.div>
      )}

      {/* Playing */}
      {gameState === 'playing' && currentItem && (
        <motion.div key={currentIndex} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {/* Conveyor Belt Display */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 text-center text-white border-4 border-slate-700 relative overflow-hidden shadow-2xl">
            {/* Moving conveyor pattern */}
            <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-950 flex justify-between px-2 opacity-50">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-2 h-full bg-slate-700 -skew-x-12" />
              ))}
            </div>

            <p className="text-teal-300 font-bold uppercase tracking-wider text-xs mb-2">Incoming Cargo Crate:</p>

            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block bg-amber-100 text-amber-900 border-4 border-amber-300 rounded-3xl px-8 py-6 shadow-xl my-2"
            >
              <div className="text-5xl mb-2">{currentItem.imageEmoji}</div>
              <div className="font-arabic text-6xl font-extrabold" dir="rtl">
                {currentItem.arabicText}
              </div>
              <div className="text-sm font-bold text-amber-800 mt-1">
                {currentItem.englishText}
              </div>
            </motion.div>

            <p className="text-slate-400 text-xs mt-3">
              Tap the matching chute below to route this cargo!
            </p>
          </div>

          {/* Chute buttons */}
          <div className={`grid gap-4 ${activeLetters.length <= 3 ? 'grid-cols-3' : activeLetters.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
            {activeLetters.map((l, idx) => {
              const color = CHUTE_COLORS[idx % CHUTE_COLORS.length]
              const isSelected = selectedChute === l.id
              const isTarget = l.id === currentItem.targetLetterId

              return (
                <motion.button
                  key={l.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSortIntoChute(l.id)}
                  disabled={Boolean(feedback)}
                  className={`
                    relative flex flex-col items-center justify-between p-4 rounded-2xl border-4 transition-all shadow-md
                    ${feedback && isSelected && isTarget ? 'border-green-500 bg-green-50 scale-105' : ''}
                    ${feedback && isSelected && !isTarget ? 'border-red-500 bg-red-50' : ''}
                    ${feedback && !isSelected && isTarget ? 'border-green-400 bg-green-50 ring-2 ring-green-300' : ''}
                    ${!feedback ? `${color.border} ${color.light} hover:scale-105` : ''}
                  `}
                >
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${color.bg}`}>
                    Chute {idx + 1}
                  </span>

                  <span className="font-arabic text-5xl font-black my-3 text-gray-800" dir="rtl">
                    {l.letter}
                  </span>

                  <span className="text-xs font-bold text-gray-600">
                    {l.name_english}
                  </span>

                  {feedback && isSelected && isTarget && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 absolute -top-3 -right-2 bg-white rounded-full" />
                  )}
                  {feedback && isSelected && !isTarget && (
                    <XCircle className="w-6 h-6 text-red-600 absolute -top-3 -right-2 bg-white rounded-full" />
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-center py-3 rounded-2xl font-black text-base ${
                  feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {feedback === 'correct' ? '✅ Great routing! Loaded into the right chute!' : '❌ Missed chute! Check the starting letter!'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Completed */}
      {gameState === 'completed' && result && (
        <GameComplete
          result={result}
          gameName="Conveyor Belt Sorter"
          onPlayAgain={handleStart}
          onBackToGames={() => navigate('/games/groups')}
        />
      )}
    </div>
  )
}
