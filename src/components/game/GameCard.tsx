import React from 'react'
import { motion } from 'framer-motion'
import { Play, Star, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SkillTag =
  | 'Recognition'
  | 'Tracing'
  | 'Phonics'
  | 'Forms'
  | 'Vocabulary'
  | 'Arcade'
  | 'Group'

export type AgeGroup = 'all' | 'explorer' | 'builder' | 'master'

export interface GameCardInfo {
  slug: string
  name: string
  description: string
  category: string
  skillTag: SkillTag
  ageGroup: AgeGroup
  icon: string
  color: string
  supportsLetterScope: boolean
  supportsGroupScope: boolean
  minLetters?: number
  maxLetters?: number
}

interface GameCardProps {
  game: GameCardInfo
  onClick: () => void
  className?: string
  /** When set, renders a compact letter-scope badge on the card */
  activeLetter?: string
}

const SKILL_TAG_COLORS: Record<SkillTag, string> = {
  Recognition: 'bg-blue-100 text-blue-700',
  Tracing: 'bg-emerald-100 text-emerald-700',
  Phonics: 'bg-purple-100 text-purple-700',
  Forms: 'bg-orange-100 text-orange-700',
  Vocabulary: 'bg-yellow-100 text-yellow-800',
  Arcade: 'bg-rose-100 text-rose-700',
  Group: 'bg-teal-100 text-teal-700',
}

const SKILL_TAG_ICONS: Record<SkillTag, string> = {
  Recognition: '👁️',
  Tracing: '✏️',
  Phonics: '👂',
  Forms: '🧩',
  Vocabulary: '📚',
  Arcade: '⚡',
  Group: '👥',
}

const AGE_LABELS: Record<AgeGroup, { label: string; icon: string; color: string }> = {
  all: { label: 'All Ages', icon: '🌈', color: 'text-gray-500' },
  explorer: { label: 'Ages 4–5', icon: '🌱', color: 'text-green-600' },
  builder: { label: 'Ages 5–6', icon: '🌿', color: 'text-teal-600' },
  master: { label: 'Ages 6–7', icon: '🌳', color: 'text-indigo-600' },
}

export default function GameCard({ game, onClick, className, activeLetter }: GameCardProps) {
  const age = AGE_LABELS[game.ageGroup]

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'group bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between border-2 border-transparent hover:border-blue-200 select-none',
        className
      )}
    >
      <div>
        {/* Top row: icon + skill tag */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110 shrink-0"
            style={{ backgroundColor: `${game.color}20` }}
          >
            <span>{game.icon}</span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Skill tag */}
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase',
                SKILL_TAG_COLORS[game.skillTag]
              )}
            >
              {SKILL_TAG_ICONS[game.skillTag]} {game.skillTag}
            </span>

            {/* Age badge */}
            <span className={cn('text-[10px] font-semibold', age.color)}>
              {age.icon} {age.label}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-brand-blue transition-colors leading-snug">
          {game.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {game.description}
        </p>

        {/* Letter-scope indicator */}
        {activeLetter && game.supportsLetterScope && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 mb-2">
            <span>🎯</span>
            <span className="font-arabic" dir="rtl">{activeLetter}</span>
            <span>-focused</span>
          </div>
        )}

        {/* Group badge */}
        {game.supportsGroupScope && game.skillTag === 'Group' && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 rounded-lg px-2 py-0.5 mb-2 w-fit">
            <Users className="w-3 h-3" />
            {game.minLetters}–{game.maxLetters} Letters
          </div>
        )}
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
