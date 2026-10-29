import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StarSize = 'sm' | 'md' | 'lg'

export interface StarRatingProps {
  /** Number of earned stars (0–3) */
  stars: number
  size?: StarSize
  className?: string
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_PX: Record<StarSize, number> = {
  sm: 24,
  md: 36,
  lg: 52,
}

// ---------------------------------------------------------------------------
// Single Star
// ---------------------------------------------------------------------------

interface StarProps {
  filled: boolean
  index: number
  sizePx: number
}

function Star({ filled, index, sizePx }: StarProps) {
  return (
    <motion.svg
      key={index}
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      aria-hidden="true"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 15,
        delay: index * 0.15,
      }}
      className="shrink-0"
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? '#FFD700' : '#D1D5DB'}
        stroke={filled ? '#F59E0B' : '#9CA3AF'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StarRating({ stars, size = 'md', className }: StarRatingProps) {
  const clampedStars = Math.min(3, Math.max(0, Math.round(stars)))
  const sizePx       = SIZE_PX[size]

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      aria-label={`${clampedStars} out of 3 stars`}
      role="img"
    >
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          index={i}
          filled={i < clampedStars}
          sizePx={sizePx}
        />
      ))}
    </div>
  )
}

export default StarRating
