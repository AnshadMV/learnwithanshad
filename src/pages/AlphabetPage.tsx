import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, BookOpen } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { cn } from '@/lib/utils'

// Cycle through these background colors per letter card
const CARD_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-400',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.85 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 120 } },
}

export default function AlphabetPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return ARABIC_LETTERS
    return ARABIC_LETTERS.filter(
      l =>
        l.name_english.toLowerCase().includes(q) ||
        l.letter.includes(q) ||
        l.transliteration.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="min-h-screen bg-[#EAF5FF] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2 rounded-full text-sm font-bold mb-3 shadow">
            <BookOpen className="w-4 h-4" />
            Arabic Alphabet
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#243247] mb-2">
            The Arabic Letters 🔤
          </h1>
          <p className="text-slate-500 text-lg mb-1">
            Click on any letter to start learning!
          </p>
          {/* Count badge */}
          <span className="inline-block bg-yellow-400 text-yellow-900 font-bold px-4 py-1 rounded-full text-sm shadow-sm">
            🌟 28 Letters to Learn
          </span>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative max-w-md mx-auto mb-10"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search letters… (e.g. Ba, ب)"
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-200 bg-white shadow focus:outline-none focus:border-blue-400 text-[#243247] placeholder-slate-400 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xl leading-none"
            >
              ×
            </button>
          )}
        </motion.div>

        {/* ── Results count ── */}
        {query && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-slate-500 mb-6 text-sm"
          >
            Showing {filtered.length} of {ARABIC_LETTERS.length} letters
          </motion.p>
        )}

        {/* ── Letter grid ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-6xl block mb-4">🔍</span>
            <p className="text-xl font-semibold">No letters found</p>
            <p className="text-sm mt-1">Try a different search</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4"
          >
            {filtered.map((letter, i) => {
              const bg = CARD_COLORS[letter.order_index % CARD_COLORS.length]
              return (
                <motion.button
                  key={letter.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => navigate(`/letter/${letter.id}`)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-white shadow-lg cursor-pointer transition-shadow hover:shadow-xl',
                    bg,
                  )}
                >
                  {/* Order badge */}
                  <span className="absolute top-2 left-2 text-xs font-bold bg-white/25 rounded-full px-1.5 py-0.5 leading-none">
                    {letter.order_index}
                  </span>

                  {/* Arabic letter */}
                  <span
                    className="font-arabic text-5xl leading-none drop-shadow"
                    dir="rtl"
                  >
                    {letter.letter}
                  </span>

                  {/* English name */}
                  <span className="text-xs font-bold tracking-wide uppercase opacity-90">
                    {letter.name_english}
                  </span>

                  {/* Transliteration */}
                  <span className="text-xs opacity-75 bg-white/20 rounded-full px-2 py-0.5">
                    /{letter.transliteration}/
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        )}

        {/* ── Bottom tip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-slate-400 text-sm"
        >
          💡 Tip: Click any letter card to see all four forms and hear how it sounds!
        </motion.div>
      </div>
    </div>
  )
}
