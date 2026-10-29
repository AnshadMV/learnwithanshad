import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'

interface Slot {
  id: string
  label: string
  expectedChar: string
  placedChar: string | null
}

export default function BuildLetterGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'build-letter',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [slots, setSlots] = useState<Slot[]>([])
  const [availableParts, setAvailableParts] = useState<string[]>([])
  const [selectedPart, setSelectedPart] = useState<string | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const LETTERS_TO_BUILD = [
    ARABIC_LETTERS[1], // Ba
    ARABIC_LETTERS[2], // Ta
    ARABIC_LETTERS[4], // Jeem
    ARABIC_LETTERS[27], // Ya
  ]

  const currentLetter = LETTERS_TO_BUILD[currentIdx]

  const loadLetter = (idx: number) => {
    const l = LETTERS_TO_BUILD[idx]
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

    if (slot.expectedChar === selectedPart) {
      playCorrect()
      recordAnswer(true, 5)

      const updatedSlots = slots.map(s =>
        s.id === slotId ? { ...s, placedChar: selectedPart } : s
      )
      setSlots(updatedSlots)
      setAvailableParts(prev => {
        const idx = prev.indexOf(selectedPart)
        if (idx !== -1) {
          const next = [...prev]
          next.splice(idx, 1)
          return next
        }
        return prev
      })
      setSelectedPart(null)

      // All slots filled?
      const remaining = updatedSlots.filter(s => s.placedChar === null).length
      if (remaining === 0) {
        setTimeout(async () => {
          if (currentIdx + 1 >= LETTERS_TO_BUILD.length) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          } else {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            loadLetter(nextIdx)
          }
        }, 900)
      }
    } else {
      playWrong()
      recordAnswer(false, 0)
      setSelectedPart(null)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-4xl shadow-sm">
            🧩
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Build the Letter
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Place the 4 written forms (Isolated, Initial, Medial, Final) into their correct matching building slots!
            </p>
          </div>
          <Button variant="sunny" onClick={handleStart} className="px-8 py-3.5 text-base">
            Build Letters Now! 🚀
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Letter {currentIdx + 1} of {LETTERS_TO_BUILD.length} • Building {currentLetter.name_english} ({currentLetter.letter})
            </span>
          </div>

          {/* Parts Palette to select from */}
          <div className="bg-sky/60 rounded-3xl p-4 flex items-center justify-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase mr-2">Available Parts:</span>
            {availableParts.map((part, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playClick()
                  setSelectedPart(part)
                }}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-arabic text-2xl font-bold shadow-sm transition-all ${
                  selectedPart === part
                    ? 'bg-brand-blue text-white border-brand-blue scale-110 shadow-md ring-4 ring-blue-200'
                    : 'bg-white text-gray-800 border-blue-200 hover:border-brand-blue'
                }`}
              >
                {part}
              </button>
            ))}
          </div>

          {/* Slots Target Grid */}
          <div className="grid grid-cols-2 gap-4">
            {slots.map(slot => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`p-6 rounded-3xl border-4 text-center flex flex-col items-center justify-center min-h-[140px] cursor-pointer transition-all ${
                  slot.placedChar
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : selectedPart
                    ? 'bg-white border-dashed border-brand-blue hover:bg-blue-50'
                    : 'bg-white border-dashed border-gray-200'
                }`}
              >
                {slot.placedChar ? (
                  <ArabicText size="3xl" weight="bold" className="text-emerald-700">
                    {slot.placedChar}
                  </ArabicText>
                ) : (
                  <span className="text-xs font-bold text-gray-400">
                    {selectedPart ? 'Tap to place part here' : 'Empty Slot'}
                  </span>
                )}
                <span className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wide">
                  {slot.label}
                </span>
              </div>
            ))}
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
