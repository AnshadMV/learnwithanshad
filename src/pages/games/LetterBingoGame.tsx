import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

interface BingoCell {
  id: string
  letter: string
  name: string
  marked: boolean
}

export default function LetterBingoGame() {
  const navigate = useNavigate()
  const { playCorrect, playWrong, playClick } = useSound()
  const { speak } = useArabicSpeech()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'letter-bingo',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [board, setBoard] = useState<BingoCell[]>([])
  const [calledLetters, setCalledLetters] = useState<LetterData[]>([])
  const [currentCallIndex, setCurrentCallIndex] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const handleStart = () => {
    startGame()
    // Select 9 distinct letters for 3x3 bingo board
    const chosenLetters = pickRandom(ARABIC_LETTERS, 9)
    const cells: BingoCell[] = chosenLetters.map(l => ({
      id: l.id,
      letter: l.letter,
      name: l.name_english,
      marked: false,
    }))

    setBoard(cells)
    setCalledLetters(shuffleArray([...chosenLetters]))
    setCurrentCallIndex(0)
    setGameState('playing')
  }

  const currentLetterToCall = calledLetters[currentCallIndex]

  const handleCellClick = async (cell: BingoCell) => {
    if (cell.marked || !currentLetterToCall) return

    if (cell.id === currentLetterToCall.id) {
      playCorrect()
      recordAnswer(true, 10)
      const nextBoard = board.map(c => (c.id === cell.id ? { ...c, marked: true } : c))
      setBoard(nextBoard)

      // Check win: row, column, or diagonal
      const markedIndices = nextBoard
        .map((c, i) => (c.marked ? i : -1))
        .filter(i => i !== -1)

      const winLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
      ]

      const hasBingo = winLines.some(line => line.every(idx => markedIndices.includes(idx)))

      if (hasBingo || currentCallIndex + 1 >= calledLetters.length) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        setCurrentCallIndex(prev => prev + 1)
      }
    } else {
      playWrong()
      recordAnswer(false, 0)
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
            🎱
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Arabic Letter Bingo
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Listen to the caller and tap the matching letter on your 3×3 bingo card to make a line!
            </p>
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Letter Bingo! 🎉
          </Button>
        </div>
      )}

      {gameState === 'playing' && currentLetterToCall && (
        <div className="space-y-6">
          {/* Call Box */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center space-y-2 border-4 border-pink-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Bingo Caller • Find this letter on your card:
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black text-gray-800">{currentLetterToCall.name_english}</span>
              <button
                onClick={() => speak(currentLetterToCall.letter)}
                className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 3x3 Card */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {board.map((cell, idx) => (
              <motion.button
                key={cell.id}
                whileHover={{ scale: cell.marked ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCellClick(cell)}
                className={`h-28 rounded-3xl border-4 text-center flex flex-col items-center justify-center shadow-card transition-all ${
                  cell.marked
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md scale-95'
                    : 'bg-white border-gray-200 hover:border-pink-300'
                }`}
              >
                <ArabicText
                  size="2xl"
                  weight="bold"
                  className={cell.marked ? 'text-white' : 'text-gray-800'}
                >
                  {cell.letter}
                </ArabicText>
                <span className={`text-[10px] font-bold ${cell.marked ? 'text-white/90' : 'text-gray-400'}`}>
                  {cell.name}
                </span>
              </motion.button>
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
