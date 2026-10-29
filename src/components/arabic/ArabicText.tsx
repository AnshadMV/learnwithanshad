import React from 'react'
import { cn } from '@/lib/utils'

interface ArabicTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  className?: string
}

const sizeClasses = {
  sm: 'text-arabic-sm',
  base: 'text-arabic-base',
  lg: 'text-arabic-lg',
  xl: 'text-arabic-xl',
  '2xl': 'text-arabic-2xl',
  '3xl': 'text-arabic-3xl',
}

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export default function ArabicText({
  children,
  size = 'base',
  weight = 'bold',
  className,
  ...props
}: ArabicTextProps) {
  return (
    <span
      dir="rtl"
      lang="ar"
      className={cn(
        'font-arabic inline-block select-none leading-relaxed',
        sizeClasses[size],
        weightClasses[weight],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
