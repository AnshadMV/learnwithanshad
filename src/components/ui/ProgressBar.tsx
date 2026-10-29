import React from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressBarProps {
  /** 0–100 */
  value: number
  /** Tailwind background colour class, e.g. 'bg-blue-500' */
  color?: string
  label?: string
  showPercent?: boolean
  animated?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  color = 'bg-blue-500',
  label,
  showPercent = false,
  animated = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercent && (
            <span className="text-sm font-semibold text-gray-600 tabular-nums">
              {clamped}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className="w-full h-4 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full',
            color,
            animated && 'transition-[width] duration-500 ease-out',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
