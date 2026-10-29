import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Check } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { shuffleArray } from '@/lib/utils'

interface PuzzlePiece {
  id: number
  correctPos: number
  currentPos: number
  label: string
}

export default function LetterPuzzleGame() {
  const navigate = useNavigate()
  const { playCorrect, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-puzzle',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [pieces, setPieces] = useState<number[]>([1, 0, 3, 2]) // scrambled 2x2 quadrant order
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  const PUZZLE_LETTERS = [
    ARABIC_LETTERS[0], // Alef
    ARABIC_LETTERS[1], // Ba
    ARABIC_LETTERS[4], // Jeem
    ARABIC_LETTERS[9], // Ra
  ]

  const currentLetter = PUZZLE_LETTERS[currentIdx]

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    setPieces([2, 0, 3, 1])
    setSelectedQuadrant(null)
    setGameState('playing')
  }

  const handleQuadrantClick = async (clickedPos: number) => {
    playClick()
    if (selectedQuadrant === null) {
      setSelectedQuadrant(clickedPos)
    } else {
      // Swap quadrant pieces
      const nextPieces = [...pieces]
      const temp = nextPieces[selectedQuadrant]
      nextPieces[selectedQuadrant] = nextPieces[clickedPos]
      nextPieces[clickedPos] = temp
      setPieces(nextPieces)
      setSelectedQuadrant(null)

      // Check solved: [0, 1, 2, 3]
      const isSolved = nextPieces.every((val, idx) => val === idx)
      if (isSolved) {
        playCorrect()
        recordAnswer(true, 15)

        setTimeout(async () => {
          if (currentIdx + 1 >= PUZZLE_LETTERS.length) {
            const res = await completeGame()
            setResult(res)
            setGameState('completed')
          } else {
            setCurrentIdx(prev => prev + 1)
            setPieces([2, 0, 3, 1])
          }
        }, 900)
      }
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-4xl shadow-sm">
            🧸
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Arabic Letter Puzzle
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              The Arabic letter is scrambled into 4 puzzle tiles. Tap two tiles to swap them until the letter is complete!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Solve Puzzles! 🧩
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Puzzle {currentIdx + 1} of {PUZZLE_LETTERS.length} • Solve {currentLetter.name_english}
            </span>
            <h2 className="text-xl font-black text-gray-800 mt-1">
              Swap the 4 tiles to assemble: <span className="font-arabic text-2xl text-brand-blue">{currentLetter.letter}</span>
            </h2>
          </div>

          {/* 2x2 Puzzle Grid */}
          <div className="w-64 h-64 mx-auto grid grid-cols-2 gap-2 p-2 bg-sky rounded-3xl border-4 border-blue-200 shadow-card">
            {pieces.map((pieceVal, slotIndex) => {
              const isSelected = selectedQuadrant === slotIndex

              return (
                <motion.div
                  key={slotIndex}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuadrantClick(slotIndex)}
                  className={`relative rounded-2xl bg-white border-2 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm ${
                    isSelected ? 'ring-4 ring-pink-400 border-pink-500' : 'border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-xs text-gray-300 font-bold block">Part #{pieceVal + 1}</span>
                    <span className="font-arabic text-4xl font-bold text-brand-blue">
                      {currentLetter.letter}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="text-center text-xs text-gray-400">
            {selectedQuadrant === null ? 'Tap a piece to select it' : 'Now tap another piece to swap them'}
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
