import React, { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'coral' | 'sunny' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// Variant & size maps
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-md hover:shadow-lg ' +
    'focus-visible:ring-blue-400',
  secondary:
    'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm ' +
    'hover:shadow focus-visible:ring-gray-400',
  success:
    'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-md hover:shadow-lg ' +
    'focus-visible:ring-emerald-400',
  coral:
    'bg-rose-400 hover:bg-rose-500 active:bg-rose-600 text-white shadow-md hover:shadow-lg ' +
    'focus-visible:ring-rose-400',
  sunny:
    'bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white shadow-md hover:shadow-lg ' +
    'focus-visible:ring-amber-400',
  ghost:
    'bg-transparent hover:bg-white/20 active:bg-white/30 text-gray-700 ' +
    'focus-visible:ring-gray-400',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
  md: 'px-5 py-2.5 text-base gap-2 rounded-2xl',
  lg: 'px-7 py-3.5 text-lg gap-2.5 rounded-2xl',
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-150 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'select-none',
          // Variant + size
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          // Disabled state
          isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none',
          className,
        )}
        {...rest}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
