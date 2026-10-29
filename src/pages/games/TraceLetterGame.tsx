import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Check, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import type { GameResult } from '@/types'

export default function TraceLetterGame() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { playCorrect, playClick } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'trace-letter',
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const TRACE_LETTERS = [
    ARABIC_LETTERS[0], // Alef
    ARABIC_LETTERS[1], // Ba
    ARABIC_LETTERS[2], // Ta
    ARABIC_LETTERS[22], // Lam
    ARABIC_LETTERS[26], // Waw
  ]

  const currentLetter = TRACE_LETTERS[currentIdx]

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleStart = () => {
    startGame()
    setCurrentIdx(0)
    setGameState('playing')
    setTimeout(clearCanvas, 50)
  }

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#4285F4'

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleDoneLetter = async () => {
    playCorrect()
    recordAnswer(true, 10)

    if (currentIdx + 1 >= TRACE_LETTERS.length) {
      const res = await completeGame()
      setResult(res)
      setGameState('completed')
    } else {
      setCurrentIdx(prev => prev + 1)
      clearCanvas()
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
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            ✏️
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Trace the Letter
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Follow the guided letter shape on the digital canvas with your finger or mouse!
            </p>
          </div>
          <Button variant="primary" onClick={handleStart} className="px-8 py-3.5 text-base">
            Start Tracing! ✍️
          </Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-xs font-bold text-gray-400 uppercase">
              Letter {currentIdx + 1} of {TRACE_LETTERS.length} • Trace {currentLetter.name_english}
            </span>
          </div>

          {/* Interactive Tracing Pad */}
          <div className="relative w-full max-w-md mx-auto h-80 rounded-3xl bg-white border-4 border-dashed border-blue-200 overflow-hidden shadow-card flex items-center justify-center select-none">
            {/* Background letter stencil */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <span className="font-arabic text-[180px] font-bold text-gray-800" dir="rtl">
                {currentLetter.letter}
              </span>
            </div>

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={420}
              height={320}
              className="absolute inset-0 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={clearCanvas} className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Clear</span>
            </Button>
            <Button
              variant="success"
              onClick={handleDoneLetter}
              disabled={!hasDrawn}
              className="flex items-center gap-1.5 px-6"
            >
              <Check className="w-5 h-5" />
              <span>I Finished Tracing!</span>
            </Button>
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
