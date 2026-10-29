import React, { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: CardPadding
}

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-7',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: CardProps) {
  const isInteractive = hoverable || Boolean(onClick)

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        // Base card
        'bg-white rounded-3xl shadow-md',
        // Padding
        PADDING_CLASSES[padding],
        // Interactive states
        isInteractive && [
          'cursor-pointer',
          'transition-all duration-200 ease-in-out',
          'hover:shadow-xl hover:-translate-y-1',
          'active:scale-[0.98] active:shadow-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        ],
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Card
