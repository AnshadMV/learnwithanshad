import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw, Check, Sparkles } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray } from '@/lib/utils'

interface WordChallenge {
  word: string
  transliteration: string
  english: string
  emoji: string
  letters: string[] // in order
}

const CHALLENGES: WordChallenge[] = [
  {
    word: 'بَاب',
    transliteration: 'bāb',
    english: 'Door',
    emoji: '🚪',
    letters: ['ب', 'ا', 'ب'],
  },
  {
    word: 'أَسَد',
    transliteration: 'asad',
    english: 'Lion',
    emoji: '🦁',
    letters: ['أ', 'س', 'د'],
  },
  {
    word: 'قَلَم',
    transliteration: 'qalam',
    english: 'Pen',
    emoji: '✏️',
    letters: ['ق', 'ل', 'م'],
  },
  {
    word: 'شَمْس',
    transliteration: 'shams',
    english: 'Sun',
    emoji: '☀️',
    letters: ['ش', 'م', 'س'],
  },
  {
    word: 'قَمَر',
    transliteration: 'qamar',
    english: 'Moon',
    emoji: '🌙',
    letters: ['ق', 'م', 'ر'],
  },
]

export default function WordBuilderGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'word-builder',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [placedLetters, setPlacedLetters] = useState<string[]>([])
  const [availableTiles, setAvailableTiles] = useState<string[]>([])
  const [result, setResult] = useState<GameResult | null>(null)

  const currentChallenge = CHALLENGES[currentIdx]

  const loadChallenge = (idx: number) => {
    const ch = CHALLENGES[idx]
    setPlacedLetters([])
    setAvailableTiles(shuffleArray([...ch.letters]))
  }

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    loadChallenge(0)
    setGameState('playing')
  }

  const handleTileClick = (tile: string, tileIdx: number) => {
    playClick()
    const nextPlaced = [...placedLetters, tile]
    setPlacedLetters(nextPlaced)

    setAvailableTiles(prev => {
      const next = [...prev]
      next.splice(tileIdx, 1)
      return next
    })

    // Check if fully placed
    if (nextPlaced.length === currentChallenge.letters.length) {
      const spelled = nextPlaced.join('')
      const expected = currentChallenge.letters.join('')

      setTimeout(async () => {
        if (spelled === expected) {
          playCorrect()
          recordAnswer(true, 15)

          if (currentIdx + 1 >= CHALLENGES.length) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          } else {
            const nextIdx = currentIdx + 1
            setCurrentIdx(nextIdx)
            loadChallenge(nextIdx)
          }
        } else {
          playWrong()
          recordAnswer(false, 0)
          // Reset current challenge tiles
          loadChallenge(currentIdx)
        }
      }, 600)
    }
  }

  const handleResetCurrent = () => {
    loadChallenge(currentIdx)
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center text-4xl shadow-sm">
            🔤
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Arabic Word Builder
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Tap the letter tiles in the right order from right to left to spell Arabic words!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Building Words! 🏗️
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-3 border-4 border-rose-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Word {currentIdx + 1} of {CHALLENGES.length}
            </span>
            <div className="text-6xl">{currentChallenge.emoji}</div>
            <h2 className="text-2xl font-black text-gray-800">
              {currentChallenge.english} ({currentChallenge.transliteration})
            </h2>
          </div>

          {/* Placed Letters Slots (RTL) */}
          <div className="bg-sky/60 rounded-3xl p-6 flex items-center justify-center gap-4 flex-row-reverse">
            {currentChallenge.letters.map((_, i) => {
              const char = placedLetters[i]
              return (
                <div
                  key={i}
                  className={`w-16 h-18 sm:w-20 sm:h-22 rounded-2xl border-4 flex items-center justify-center font-arabic text-3xl font-bold shadow-inner ${
                    char
                      ? 'bg-white border-brand-blue text-brand-blue shadow'
                      : 'bg-white/40 border-dashed border-blue-200'
                  }`}
                >
                  {char || ''}
                </div>
              )
            })}
          </div>

          {/* Available Tiles */}
          <div className="text-center space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase">
              Tap letters to place in order:
            </div>
            <div className="flex items-center justify-center gap-3">
              {availableTiles.map((tile, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTileClick(tile, idx)}
                  className="w-16 h-16 rounded-2xl bg-white border-2 border-rose-300 text-gray-800 font-arabic text-3xl font-bold shadow-card hover:bg-rose-50 flex items-center justify-center"
                >
                  {tile}
                </motion.button>
              ))}
            </div>

            {placedLetters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCurrent}
                className="text-xs text-gray-400 mt-2"
              >
                Reset letters
              </Button>
            )}
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
