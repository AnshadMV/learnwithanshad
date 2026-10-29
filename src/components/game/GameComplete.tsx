import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Home, ArrowRight, Award, Trophy, Star } from 'lucide-react'
import { useConfetti } from '@/hooks/useConfetti'
import { useSound } from '@/hooks/useSound'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { formatDuration } from '@/lib/utils'

interface GameCompleteProps {
  result: GameResult
  onReplay?: () => void
  onPlayAgain?: () => void
  onNext?: () => void
  onHome?: () => void
  onBackToGames?: () => void
  gameName?: string
}

export default function GameComplete({
  result,
  onReplay,
  onPlayAgain,
  onNext,
  onHome,
  onBackToGames,
  gameName,
}: GameCompleteProps) {
  const { celebrateBig } = useConfetti()
  const { playComplete } = useSound()

  const handleReplay = onPlayAgain || onReplay || (() => window.location.reload())
  const handleHome = onBackToGames || onHome || (() => {})

  useEffect(() => {
    celebrateBig()
    playComplete()
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-4 border-sunny-400 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sunny-100 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-100 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-sunny-100 text-sunny-500 flex items-center justify-center shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-800 mb-2 font-display">
            {result.accuracy >= 80 ? 'Incredible Job! 🎉' : result.accuracy >= 50 ? 'Great Effort! 🌟' : 'Good Practice! 👍'}
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            You completed the activity with flying colors!
          </p>

          {/* Stars */}
          <div className="flex justify-center mb-6">
            <StarRating stars={result.stars} size="lg" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-sky rounded-2xl p-4 mb-6">
            <div className="text-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Score</span>
              <div className="text-2xl font-black text-brand-blue">{result.score}</div>
            </div>
            <div className="text-center border-x border-blue-200">
              <span className="text-xs font-bold text-gray-500 uppercase">Accuracy</span>
              <div className="text-2xl font-black text-brand-green">{result.accuracy}%</div>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-gray-500 uppercase">Correct</span>
              <div className="text-2xl font-black text-brand-coral">
                {result.questionsCorrect}/{result.questionsTotal}
              </div>
            </div>
          </div>

          {result.durationSeconds > 0 && (
            <div className="text-xs text-gray-400 mb-6">
              Time spent: {formatDuration(result.durationSeconds)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleReplay}
              className="w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </Button>
            {onNext ? (
              <Button
                variant="primary"
                onClick={onNext}
                className="w-full flex items-center justify-center gap-2"
              >
                <span>Next Activity</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleHome}
                className="w-full flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Games Home</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
