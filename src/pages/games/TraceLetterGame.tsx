import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Check, Sparkles } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import { useSound } from '@/hooks/useSound'
import { useGameSession } from '@/hooks/useGameSession'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'
import LetterScopeBanner from '@/components/game/LetterScopeBanner'
import type { GameResult } from '@/types'

export default function TraceLetterGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramLetter = searchParams.get('letter')

  const targetLetterObj = useMemo(() => {
    return paramLetter ? getLetterById(paramLetter) || null : null
  }, [paramLetter])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { playCorrect, playClick, playStar } = useSound()
  const { score, recordAnswer, completeGame, startGame } = useGameSession({
    gameSlug: 'trace-letter',
    letterId: paramLetter || undefined,
  })

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)

  const TRACE_ITEMS: { char: string; name: string; subtitle: string }[] = useMemo(() => {
    if (targetLetterObj) {
      return [
        { char: targetLetterObj.forms.isolated, name: `${targetLetterObj.name_english} Isolated`, subtitle: 'Trace the full isolated shape' },
        { char: targetLetterObj.forms.initial, name: `${targetLetterObj.name_english} Initial`, subtitle: 'Trace the beginning shape' },
        { char: targetLetterObj.forms.medial, name: `${targetLetterObj.name_english} Medial`, subtitle: 'Trace the middle connected shape' },
        { char: targetLetterObj.forms.final, name: `${targetLetterObj.name_english} Final`, subtitle: 'Trace the ending shape' },
      ]
    }
    return [
      { char: ARABIC_LETTERS[0].letter, name: ARABIC_LETTERS[0].name_english, subtitle: 'Trace letter Alef' },
      { char: ARABIC_LETTERS[1].letter, name: ARABIC_LETTERS[1].name_english, subtitle: 'Trace letter Ba' },
      { char: ARABIC_LETTERS[2].letter, name: ARABIC_LETTERS[2].name_english, subtitle: 'Trace letter Ta' },
      { char: ARABIC_LETTERS[22].letter, name: ARABIC_LETTERS[22].name_english, subtitle: 'Trace letter Lam' },
      { char: ARABIC_LETTERS[26].letter, name: ARABIC_LETTERS[26].name_english, subtitle: 'Trace letter Waw' },
    ]
  }, [targetLetterObj])

  const currentItem = TRACE_ITEMS[currentIdx % TRACE_ITEMS.length]

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

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setIsDrawing(true)
    setHasDrawn(true)
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#4285F4'
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCoordinates(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDraw = () => {
    setIsDrawing(false)
  }

  const handleDone = async () => {
    if (!hasDrawn) return
    playCorrect()
    playStar()
    recordAnswer(true, 15)

    if (currentIdx + 1 >= TRACE_ITEMS.length) {
      const res = await completeGame()
      setResult(res)
      setGameState('completed')
    } else {
      const next = currentIdx + 1
      setCurrentIdx(next)
      clearCanvas()
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
      <LetterScopeBanner currentLetterId={paramLetter} gameSlug="trace-letter" />

      {gameState === 'intro' && (
        <div className="bg-white rounded-3xl p-8 shadow-card text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 text-brand-blue flex items-center justify-center text-4xl shadow-sm">
            ✏️
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 font-display">
              Trace the Letter
            </h1>
            {targetLetterObj ? (
              <div className="mt-2 space-y-1">
                <p className="text-brand-blue font-black text-lg">
                  Handwriting Practice: {targetLetterObj.name_english} ({targetLetterObj.name_arabic})
                </p>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Trace the letter and its connected shapes with your finger or mouse!
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Follow the guided letter shape on the digital canvas with your finger or mouse!
              </p>
            )}
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
              Step {currentIdx + 1} of {TRACE_ITEMS.length} • {currentItem.name}
            </span>
            <p className="text-sm font-bold text-gray-600 mt-1">{currentItem.subtitle}</p>
          </div>

          <div className="relative mx-auto w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] bg-white rounded-3xl shadow-card border-4 border-blue-200 overflow-hidden select-none">
            {/* Background letter guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-arabic text-[180px] sm:text-[220px] font-bold text-gray-200/80 leading-none">
                {currentItem.char}
              </span>
            </div>

            {/* Drawing Canvas */}
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" onClick={clearCanvas} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Clear Canvas</span>
            </Button>
            <Button
              variant="primary"
              disabled={!hasDrawn}
              onClick={handleDone}
              className="flex items-center gap-2 px-8"
            >
              <Check className="w-4 h-4" />
              <span>Next Letter! ✨</span>
            </Button>
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
