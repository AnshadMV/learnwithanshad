import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { LetterData } from '@/data/arabicLetters'
import ArabicText from './ArabicText'
import { CheckCircle2, Lock, Volume2 } from 'lucide-react'

interface LetterCardProps {
  letter: LetterData
  onClick?: () => void
  onAudioClick?: (e: React.MouseEvent) => void
  selected?: boolean
  completed?: boolean
  locked?: boolean
  showName?: boolean
  className?: string
}

const COLOR_VARIANTS = [
  'from-blue-400 to-blue-600 text-white',
  'from-emerald-400 to-emerald-600 text-white',
  'from-amber-400 to-amber-600 text-white',
  'from-rose-400 to-rose-600 text-white',
  'from-purple-400 to-purple-600 text-white',
  'from-teal-400 to-teal-600 text-white',
  'from-orange-400 to-orange-600 text-white',
]

export default function LetterCard({
  letter,
  onClick,
  onAudioClick,
  selected = false,
  completed = false,
  locked = false,
  showName = true,
  className,
}: LetterCardProps) {
  const colorIndex = (letter.order_index - 1) % COLOR_VARIANTS.length
  const gradient = COLOR_VARIANTS[colorIndex]

  return (
    <motion.div
      whileHover={!locked ? { scale: 1.05, y: -4 } : {}}
      whileTap={!locked ? { scale: 0.95 } : {}}
      onClick={!locked ? onClick : undefined}
      className={cn(
        'relative group rounded-3xl p-5 flex flex-col items-center justify-between shadow-card transition-all cursor-pointer select-none min-h-[160px] min-w-[120px] bg-white border-2',
        selected ? 'border-brand-blue ring-4 ring-blue-200' : 'border-transparent hover:border-blue-200',
        locked && 'opacity-60 cursor-not-allowed bg-gray-50',
        className
      )}
    >
      {/* Status Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs pointer-events-none">
        <span className="font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">
          #{letter.order_index}
        </span>
        <div className="flex items-center gap-1">
          {completed && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100" />
          )}
          {locked && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Main Letter Display */}
      <div className="my-auto py-2 flex items-center justify-center">
        <div className={cn(
          'w-20 h-20 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br',
          gradient
        )}>
          <ArabicText size="2xl" weight="bold" className="text-white drop-shadow-sm">
            {letter.letter}
          </ArabicText>
        </div>
      </div>

      {/* Letter Meta / Name */}
      {showName && (
        <div className="text-center w-full mt-2">
          <div className="font-bold text-gray-800 text-sm">{letter.name_english}</div>
          <div className="text-xs text-gray-500 font-arabic" dir="rtl">
            {letter.name_arabic}
          </div>
        </div>
      )}

      {/* Audio Button */}
      {onAudioClick && (
        <button
          type="button"
          onClick={onAudioClick}
          aria-label={`Listen to ${letter.name_english}`}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors opacity-80 group-hover:opacity-100"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}
