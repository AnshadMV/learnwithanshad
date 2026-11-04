import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'

interface Slot {
  id: string
  label: string
  expectedChar: string
  placedChar: string | null
}

export default function BuildLetterGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const { playCorrect, playWrong, playClick, playStar } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'build-letter',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [slots, setSlots] = useState<Slot[]>([])
  const [availableParts, setAvailableParts] = useState<string[]>([])
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const LETTERS_TO_BUILD: LetterData[] = useMemo(() => {
    if (targetLetterObj) {
      return [targetLetterObj]
    }
    return [
      ARABIC_LETTERS[1], // Ba
      ARABIC_LETTERS[2], // Ta
      ARABIC_LETTERS[4], // Jeem
      ARABIC_LETTERS[27], // Ya
    ]
  }, [targetLetterObj])

  const currentLetter = LETTERS_TO_BUILD[currentIdx % LETTERS_TO_BUILD.length]

  const loadLetter = (idx: number) => {
    const l = LETTERS_TO_BUILD[idx % LETTERS_TO_BUILD.length]
    const newSlots: Slot[] = [
      { id: 'isolated', label: 'Isolated Form', expectedChar: l.forms.isolated, placedChar: null },
      { id: 'initial', label: 'Initial Form', expectedChar: l.forms.initial, placedChar: null },
      { id: 'medial', label: 'Medial Form', expectedChar: l.forms.medial, placedChar: null },
      { id: 'final', label: 'Final Form', expectedChar: l.forms.final, placedChar: null },
    ]

    const parts = [l.forms.isolated, l.forms.initial, l.forms.medial, l.forms.final]
    // Shuffle parts
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[parts[i], parts[j]] = [parts[j], parts[i]]
    }

    setSlots(newSlots)
    setAvailableParts(parts)
    setSelectedPart(null)
  }

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    loadLetter(0)
    setGameState('playing')
  }

  const handleSlotClick = async (slotId: string) => {
    if (!selectedPart) return

    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.placedChar) return

    const isMatch = slot.expectedChar === selectedPart

    if (isMatch) {
      playCorrect()
      recordAnswer(true, 15)

      const nextSlots = slots.map(s =>
        s.id === slotId ? { ...s, placedChar: selectedPart } : s
      )
      setSlots(nextSlots)

      // Remove placed part
      setAvailableParts(prev => {
        const idx = prev.indexOf(selectedPart)
        if (idx !== -1) {
          const c = [...prev]
          c.splice(idx, 1)
          return c
        }
        return prev
      })
      setSelectedPart(null)

      // Check if all placed
      const allDone = nextSlots.every(s => s.placedChar !== null)
      if (allDone) {
        playStar()
        setTimeout(async () => {
          if (currentIdx + 1 >= LETTERS_TO_BUILD.length) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          } else {
            const next = currentIdx + 1
            setCurrentIdx(next)
            loadLetter(next)
          }
        }, 1200)
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="build-letter" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-sunny-100 text-sunny-600 flex items-center justify-center text-4xl shadow-sm">
            🧩
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Build the Letter
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Assemble Letter {targetLetterObj.name_english} ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Pick and snap each piece into the right position (isolated, initial, medial, and final) to complete <strong>{targetLetterObj.name_english}</strong>!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Snap letter piece shapes into the right slots: isolated, initial, medial, and final!
              </p>
            )}
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Building! 🧩
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Target Header */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center border-4 border-sunny-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Building: {currentLetter.name_english} ({currentLetter.name_arabic})
            </span>
            <div className="text-5xl font-arabic font-bold text-brand-blue my-2">
              {currentLetter.letter}
            </div>
            <p className="text-xs text-gray-500">
              Select a piece below, then tap the matching form slot!
            </p>
          </div>

          {/* Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slots.map(slot => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`p-4 rounded-3xl border-4 text-center min-h-[140px] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                  slot.placedChar
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm'
                    : selectedPart
                    ? 'bg-white border-dashed border-sunny-400 hover:bg-sunny-50 hover:scale-105'
                    : 'bg-white border-dashed border-gray-300'
                }`}
              >
                <span className="text-xs font-bold text-gray-500">{slot.label}</span>
                {slot.placedChar ? (
                  <ArabicText size="3xl" weight="bold" className="text-emerald-700">
                    {slot.placedChar}
                  </ArabicText>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg">
                    ?
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Available Parts */}
          <div className="bg-white rounded-3xl p-6 shadow-card space-y-3">
            <span className="text-xs font-extrabold uppercase text-gray-400 block text-center">
              Available Pieces (Tap to Pick):
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {availableParts.map((part, i) => {
                const isSelected = selectedPart === part
                return (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      playClick()
                      setSelectedPart(isSelected ? null : part)
                    }}
                    className={`w-16 h-16 rounded-2xl border-4 text-center flex items-center justify-center shadow transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sunny-500 text-white border-sunny-600 scale-110 shadow-lg ring-4 ring-sunny-200'
                        : 'bg-sky hover:bg-white border-gray-200 text-gray-800'
                    }`}
                  >
                    <ArabicText size="2xl" weight="bold">
                      {part}
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
