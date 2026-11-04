import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import { getLetterBingoCells } from '@/data/letterVariants'
import { getKidCardTheme } from '@/data/kidColorThemes'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'
import { useGameSession } from '@/hooks/useGameSession'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'
import { pickRandom, shuffleArray } from '@/lib/utils'

interface BingoCell {
  id: string
  letter: string
  name: string
  arabicName?: string
  marked: boolean
}

export default function LetterBingoGame() {
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
    gameSlug: 'letter-bingo',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [board, setBoard] = useState<BingoCell[]>([])
  const [calledList, setCalledList] = useState<BingoCell[]>([])
  const [currentCallIndex, setCurrentCallIndex] = useState(0)
  const [result, setResult] = useState<GameResult | null>(null)

  const handleStart = () => {
    startGame()
    let cells: BingoCell[] = []

    if (paramLetter) {
      // LETTER-SPECIFIC BINGO:
      // 9 distinct variants, forms, and vowel marks of the selected letter!
      const variants = getLetterBingoCells(paramLetter)
      cells = variants.map(v => ({
        id: v.id,
        letter: v.char,
        name: v.name,
        arabicName: v.arabicName,
        marked: false,
      }))
    } else {
      // General Alphabet Bingo
      const chosenLetters = pickRandom(ARABIC_LETTERS, 9)
      cells = chosenLetters.map(l => ({
        id: l.id,
        letter: l.letter,
        name: l.name_english,
        arabicName: l.name_arabic,
        marked: false,
      }))
    }

    setBoard(cells)
    const shuffledCalls = shuffleArray([...cells])
    setCalledList(shuffledCalls)
    setCurrentCallIndex(0)
    setGameState('playing')

    setTimeout(() => {
      if (shuffledCalls[0]) {
        speak(shuffledCalls[0].letter)
      }
    }, 400)
  }

  const currentCall = calledList[currentCallIndex]

  const handleCellClick = async (cell: BingoCell) => {
    if (cell.marked || !currentCall) return

    speak(cell.letter)

    if (cell.id === currentCall.id) {
      playCorrect()
      playStar()
      celebrate()
      recordAnswer(true, 15)
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

      if (hasBingo || currentCallIndex + 1 >= calledList.length) {
        const res = await completeGame()
        setResult(res)
        setGameState('completed')
      } else {
        const nextIdx = currentCallIndex + 1
        setCurrentCallIndex(nextIdx)
        setTimeout(() => {
          if (calledList[nextIdx]) {
            speak(calledList[nextIdx].letter)
          }
        }, 500)
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="letter-bingo" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-100 text-pink-600 flex items-center justify-center text-4xl shadow-sm">
            🎱
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Arabic Letter Bingo
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Letter {targetLetterObj.name_english} Bingo ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Listen to the voice caller and mark the correct form or vowel mark of <strong>{targetLetterObj.name_english}</strong> on your 3×3 bingo card!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Listen to the caller and tap the matching letter on your 3×3 bingo card to make a line and win Bingo!
              </p>
            )}
          </div>
          <Button variant="coral" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Letter Bingo! 🎉
          </Button>
        </div>
      )}

      {gameState === 'playing' && currentCall && (
        <div className="space-y-6">
          {/* Call Box */}
          <div className="bg-white rounded-3xl p-6 shadow-card text-center space-y-2 border-4 border-pink-200">
            <span className="text-xs font-extrabold uppercase text-gray-400">
              Bingo Caller • Find this on your card:
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="min-w-14 px-3 h-14 rounded-2xl bg-pink-600 text-white font-arabic font-bold text-3xl flex items-center justify-center shadow">
                  {currentCall.letter}
                </span>
                <span className="text-2xl font-black text-gray-800">{currentCall.name}</span>
              </div>
              <button
                onClick={() => speak(currentCall.letter)}
                className="p-3 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors shadow-sm"
                title="Listen to call"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            {currentCall.arabicName && (
              <p className="text-xs text-gray-500 font-arabic font-semibold" dir="rtl">
                {currentCall.arabicName}
              </p>
            )}
          </div>

          {/* 3x3 Card */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            {board.map((cell, idx) => {
              const theme = getKidCardTheme(idx)
              return (
                <motion.button
                  key={cell.id}
                  whileHover={{ scale: cell.marked ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCellClick(cell)}
                  className={`h-32 sm:h-36 rounded-3xl border-4 text-center flex flex-col items-center justify-center gap-1 shadow-card transition-all cursor-pointer select-none ${
                    cell.marked
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-md scale-95 ring-4 ring-emerald-300'
                      : `${theme.bg} ${theme.border} ${theme.hoverBorder} ${theme.hoverBg} shadow-md`
                  }`}
                >
                  <ArabicText
                    size="3xl"
                    weight="bold"
                    className={`text-4xl sm:text-5xl font-black ${cell.marked ? 'text-white' : theme.text}`}
                  >
                    {cell.letter}
                  </ArabicText>
                  <span className={`text-xs font-black px-1 line-clamp-1 max-w-[95%] ${cell.marked ? 'text-white/90' : 'text-gray-700'}`}>
                    {cell.name}
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
