import React, { type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: ModalSize
  className?: string
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  full: 'max-w-[95vw]',
}

// ---------------------------------------------------------------------------
// Close icon
// ---------------------------------------------------------------------------

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose() }}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />

        {/* Panel */}
        <Dialog.Content
          onEscapeKeyDown={onClose}
          onPointerDownOutside={onClose}
          className={cn(
            // Positioning
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            // Layout
            'w-full mx-auto',
            SIZE_CLASSES[size],
            // Appearance — child-friendly large rounded design
            'bg-white rounded-3xl shadow-2xl',
            'p-6 sm:p-8',
            // Animation
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4',
            'focus:outline-none',
            className,
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={cn(
                    'p-1.5 rounded-xl text-gray-500',
                    'hover:bg-gray-100 hover:text-gray-700',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    'transition-colors',
                  )}
                >
                  <CloseIcon />
                </button>
              </Dialog.Close>
            </div>
          )}

          {/* Close button without title */}
          {!title && (
            <div className="flex justify-end mb-2">
              <Dialog.Close asChild>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={cn(
                    'p-1.5 rounded-xl text-gray-500',
                    'hover:bg-gray-100 hover:text-gray-700',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    'transition-colors',
                  )}
                >
                  <CloseIcon />
                </button>
              </Dialog.Close>
            </div>
          )}

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default Modal
