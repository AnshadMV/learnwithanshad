import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Volume2, Sparkles, Filter } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_EXAMPLES, LetterExample } from '@/data/letterExamples'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import ArabicText from '@/components/arabic/ArabicText'
import { cn } from '@/lib/utils'

export default function WordExplorerPage() {
  const [selectedLetter, setSelectedLetter] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const { speak, isSupported } = useArabicSpeech()

  const filteredWords = useMemo(() => {
    return LETTER_EXAMPLES.filter(word => {
      if (selectedLetter !== 'all' && word.letter_id !== selectedLetter) {
        return false
      }
      if (selectedPosition !== 'all' && word.letter_position !== selectedPosition) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesArabic = word.arabic_word.includes(q)
        const matchesTrans = word.transliteration.toLowerCase().includes(q)
        const matchesEng = word.english_meaning.toLowerCase().includes(q)
        if (!matchesArabic && !matchesTrans && !matchesEng) return false
      }
      return true
    })
  }, [selectedLetter, selectedPosition, searchQuery])

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-brand-blue font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>840 Illustrated Arabic Words</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#243247] font-display">
          Arabic Word Explorer 🌍
        </h1>
        <p className="text-gray-600 text-lg">
          Listen, discover meanings, and see how letters appear in fun everyday words!
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search words (e.g. duck, بَاب, asad)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-brand-blue focus:outline-none transition-colors"
            />
          </div>

          {/* Position Filter */}
          <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Position:
            </span>
            {(['all', 'beginning', 'middle', 'end'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize',
                  selectedPosition === pos
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {pos === 'all' ? 'All Positions' : pos}
              </button>
            ))}
          </div>
        </div>

        {/* Letters Carousel */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Filter by Target Letter:
            </span>
            <span className="text-xs font-bold text-brand-blue">
              Showing {filteredWords.length} words
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            <button
              onClick={() => setSelectedLetter('all')}
              className={cn(
                'px-4 py-2 rounded-2xl font-bold text-sm shrink-0 transition-all border-2',
                selectedLetter === 'all'
                  ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              )}
            >
              All Letters (28)
            </button>
            {ARABIC_LETTERS.map(letter => (
              <button
                key={letter.id}
                onClick={() => setSelectedLetter(letter.id)}
                className={cn(
                  'w-12 h-12 rounded-2xl font-bold font-arabic text-xl shrink-0 transition-all border-2 flex items-center justify-center',
                  selectedLetter === letter.id
                    ? 'bg-brand-blue text-white border-brand-blue shadow-md scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                )}
                dir="rtl"
              >
                {letter.letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word Cards Grid */}
      {filteredWords.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto shadow-card">
          <span className="text-5xl block mb-3">🔍</span>
          <h3 className="text-xl font-bold text-gray-700 mb-1">No words found</h3>
          <p className="text-sm text-gray-400">
            Try a different search word or select another letter above!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredWords.map((word, idx) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.5) }}
              className="bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover border-2 border-transparent hover:border-blue-100 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl p-2 rounded-2xl bg-sky group-hover:scale-110 transition-transform">
                  {word.emoji}
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full',
                    word.letter_position === 'beginning'
                      ? 'bg-blue-100 text-blue-700'
                      : word.letter_position === 'middle'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {word.letter_position}
                </span>
              </div>

              <div className="my-2">
                <ArabicText
                  size="xl"
                  weight="bold"
                  className="text-gray-900 leading-tight block mb-1 drop-shadow-sm"
                >
                  {word.arabic_word}
                </ArabicText>
                <div className="text-xs font-bold text-brand-blue tracking-wide">
                  {word.transliteration}
                </div>
                <div className="text-base font-extrabold text-gray-800 capitalize mt-0.5">
                  {word.english_meaning}
                </div>
                {word.child_explanation && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {word.child_explanation}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-3">
                <span className="text-[11px] font-semibold text-gray-400">
                  Letter: {ARABIC_LETTERS.find(l => l.id === word.letter_id)?.name_english}
                </span>
                {isSupported && (
                  <button
                    onClick={() => speak(word.arabic_word)}
                    className="p-2 rounded-xl bg-blue-50 text-brand-blue hover:bg-blue-100 transition-colors"
                    title="Listen pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
