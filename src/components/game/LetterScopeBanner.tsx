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
    <div className="relative mb-4">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-3 sm:p-4 text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-arabic text-2xl sm:text-3xl font-bold shadow-inner border border-white/30">
            {letter ? letter.letter : '🌟'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
                {letter ? 'Letter Focus' : 'All Alphabet'}
              </span>
              <span className="text-xs text-white/80 hidden sm:inline">Letter-Specific Learning</span>
            </div>
            <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
              {letter ? (
                <>
                  <span>Practicing:</span>
                  <span className="text-sunny-300 font-bold">{letter.name_english}</span>
                  <span className="font-arabic text-lg font-bold text-white" dir="rtl">({letter.name_arabic})</span>
                </>
              ) : (
                <span>Practicing All Arabic Alphabet</span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenPicker(!openPicker)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/30 shadow-sm"
          >
            <span>{letter ? 'Change Letter' : 'Pick a Letter'}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', openPicker && 'rotate-180')} />
          </button>

          {letter && (
            <button
              onClick={() => handleSelectLetter(null)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Switch to all alphabet"
            >
              <X className="w-4 h-4" />
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
