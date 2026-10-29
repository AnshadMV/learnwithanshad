import React from 'react'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GameCardInfo {
  slug: string
  name: string
  description: string
  category: string
  icon: string
  color: string
}

interface GameCardProps {
  game: GameCardInfo
  onClick: () => void
  className?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Recognition: 'bg-blue-100 text-blue-700',
  Writing: 'bg-emerald-100 text-emerald-700',
  Listening: 'bg-purple-100 text-purple-700',
  Arcade: 'bg-rose-100 text-rose-700',
}

export default function GameCard({ game, onClick, className }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between border-2 border-transparent hover:border-blue-200 select-none',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${game.color}20` }}
          >
            <span>{game.icon}</span>
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase',
              CATEGORY_COLORS[game.category] || 'bg-gray-100 text-gray-700'
            )}
          >
            {game.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-brand-blue transition-colors">
          {game.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {game.description}
        </p>
      </div>

      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">Playable now</span>
        <div
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-sm shadow-sm transition-all group-hover:shadow"
          style={{ backgroundColor: game.color }}
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Play</span>
        </div>
      </div>
    </motion.div>
  )
}
