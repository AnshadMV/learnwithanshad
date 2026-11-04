import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronDown, Check, X } from 'lucide-react'
import { ARABIC_LETTERS, LetterData, getLetterById } from '@/data/arabicLetters'
import ArabicText from '@/components/arabic/ArabicText'
import { cn } from '@/lib/utils'

interface LetterScopeBannerProps {
  currentLetterId?: string | null
  gameSlug: string
  onLetterChange?: (letterId: string | null) => void
}

export default function LetterScopeBanner({
  currentLetterId,
  gameSlug,
  onLetterChange,
}: LetterScopeBannerProps) {
  const navigate = useNavigate()
  const [openPicker, setOpenPicker] = useState(false)

  const letter = currentLetterId ? getLetterById(currentLetterId) : null

  const handleSelectLetter = (id: string | null) => {
    setOpenPicker(false)
    if (onLetterChange) {
      onLetterChange(id)
    } else {
      if (id) {
        navigate(`/games/${gameSlug}?letter=${id}`)
      } else {
        navigate(`/games/${gameSlug}`)
      }
    }
  }

  return (
    <div className="relative mb-3">
      <div className="bg-white/95 rounded-2xl p-2 sm:p-2.5 border-2 border-blue-200 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-400 text-slate-900 font-arabic text-xl sm:text-2xl font-black shadow-sm flex items-center justify-center shrink-0">
            {letter ? letter.letter : '🌟'}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                {letter ? 'Letter Focus' : 'All Letters'}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1">
              {letter ? (
                <>
                  <span className="text-brand-blue">{letter.name_english}</span>
                  <span className="font-arabic font-bold text-amber-600" dir="rtl">({letter.name_arabic})</span>
                </>
              ) : (
                <span>All Alphabet</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOpenPicker(!openPicker)}
            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-brand-blue px-2.5 py-1 rounded-xl text-xs font-black transition-all border border-blue-200 shadow-sm"
          >
            <span>{letter ? 'Change' : 'Pick'}</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', openPicker && 'rotate-180')} />
          </button>

          {letter && (
            <button
              onClick={() => handleSelectLetter(null)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset to all letters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown letter selector */}
      {openPicker && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-2xl p-4 shadow-2xl border-2 border-blue-200 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-extrabold uppercase text-gray-500">
              Select a letter to focus this game:
            </span>
            <button
              onClick={() => handleSelectLetter(null)}
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Play all letters
            </button>
          </div>

          <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-14 gap-1.5 max-h-48 overflow-y-auto p-1">
            {ARABIC_LETTERS.map(l => {
              const isSelected = l.id === currentLetterId
              return (
                <button
                  key={l.id}
                  onClick={() => handleSelectLetter(l.id)}
                  className={cn(
                    'p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all',
                    isSelected
                      ? 'bg-brand-blue text-white shadow-md scale-105'
                      : 'bg-sky/60 hover:bg-sky text-gray-800 hover:scale-105'
                  )}
                >
                  <span className="font-arabic text-lg font-bold">{l.letter}</span>
                  <span className="text-[9px] font-semibold truncate max-w-full">{l.name_english}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
