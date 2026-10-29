import { useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Volume2, ChevronLeft, ChevronRight, ArrowLeft, Gamepad2 } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { cn } from '@/lib/utils'

const FORM_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', label: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', label: 'bg-green-500' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', label: 'bg-yellow-500' },
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'bg-red-500' },
]

const HERO_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-red-400 to-red-500',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-yellow-400 to-orange-500',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
]

export default function LetterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { speak, isSupported } = useArabicSpeech()

  const letter = useMemo(() => ARABIC_LETTERS.find(l => l.id === id), [id])
  const letterIndex = useMemo(
    () => ARABIC_LETTERS.findIndex(l => l.id === id),
    [id],
  )

  const prevLetter = letterIndex > 0 ? ARABIC_LETTERS[letterIndex - 1] : null
  const nextLetter = letterIndex < ARABIC_LETTERS.length - 1 ? ARABIC_LETTERS[letterIndex + 1] : null

  const gradient = HERO_GRADIENTS[(letterIndex >= 0 ? letterIndex : 0) % HERO_GRADIENTS.length]

  if (!letter) {
    return (
      <div className="min-h-screen bg-[#EAF5FF] flex flex-col items-center justify-center gap-6 p-8">
        <span className="text-8xl">🔍</span>
        <h1 className="text-3xl font-extrabold text-[#243247]">Letter not found</h1>
        <Link
          to="/alphabet"
          className="flex items-center gap-2 bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Alphabet
        </Link>
      </div>
    )
  }

  const forms = [
    { key: 'isolated', label: 'Isolated', value: letter.forms.isolated },
    { key: 'initial', label: 'Initial', value: letter.forms.initial },
    { key: 'medial', label: 'Medial (Middle)', value: letter.forms.medial },
    { key: 'final', label: 'Final', value: letter.forms.final },
  ]

  return (
    <div className="min-h-screen bg-[#EAF5FF]">
      {/* ── Back link ── */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link
          to="/alphabet"
          className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-700 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Alphabet
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'relative rounded-3xl bg-gradient-to-br p-10 text-white text-center shadow-2xl overflow-hidden',
            gradient,
          )}
        >
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />

          {/* Order badge */}
          <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
            Letter #{letter.order_index}
          </div>

          {/* Big Arabic letter */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
            className="font-arabic text-8xl md:text-[8rem] leading-none drop-shadow-lg mb-4"
            dir="rtl"
          >
            {letter.letter}
          </motion.div>

          <h1 className="text-3xl font-extrabold mb-1">{letter.name_english}</h1>
          <p className="text-white/80 text-lg mb-1 font-arabic" dir="rtl">{letter.name_arabic}</p>
          <p className="text-white/70 text-base font-mono">/{letter.transliteration}/</p>

          {/* Listen button */}
          {isSupported && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => speak(letter.letter)}
              className="mt-5 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white font-bold px-6 py-3 rounded-2xl transition-colors shadow"
            >
              <Volume2 className="w-5 h-5" /> Listen 🔊
            </motion.button>
          )}
        </motion.div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
        {/* ── Four Forms ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-extrabold text-[#243247] mb-4 flex items-center gap-2">
            ✏️ Four Forms of {letter.name_english}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {forms.map((form, i) => {
              const colors = FORM_COLORS[i]
              return (
                <motion.div
                  key={form.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 shadow-sm',
                    colors.bg, colors.border,
                  )}
                >
                  <span
                    className={cn('font-arabic text-4xl leading-none', colors.text)}
                    dir="rtl"
                  >
                    {form.value}
                  </span>
                  <span className={cn('text-xs font-bold text-white px-2 py-0.5 rounded-full', colors.label)}>
                    {form.label}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {!letter.connects_following && (
            <p className="mt-3 text-sm text-slate-500 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
              💡 <strong>{letter.name_english}</strong> does not connect to the following letter, so its initial and isolated forms look the same.
            </p>
          )}
        </motion.section>

        {/* ── Sound description ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow border border-blue-100"
        >
          <h2 className="text-xl font-extrabold text-[#243247] mb-3 flex items-center gap-2">
            🎵 How Does It Sound?
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            <strong className="text-blue-500">{letter.name_english}</strong> sounds like: <em className="text-green-600">"{letter.sound_description}"</em>
          </p>
          <p className="text-slate-500 text-sm mt-2">{letter.description}</p>

          {isSupported && (
            <button
              onClick={() => speak(letter.letter)}
              className="mt-4 inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Volume2 className="w-4 h-4" /> Hear the letter
            </button>
          )}
        </motion.section>

        {/* ── Letter-Specific Games Grid ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#243247] flex items-center gap-2">
              <span>🎮 Practice Games for</span>
              <span className="font-arabic text-3xl text-brand-blue" dir="rtl">{letter.letter}</span>
              <span className="text-base text-gray-400 font-medium">({letter.name_english})</span>
            </h2>
            <Link
              to="/games"
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              <span>View all 24+ games</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* 1. Tracing */}
            <Link
              to={`/games/trace-letter?letter=${letter.id}`}
              className="group bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-200 hover:border-amber-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">✍️</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                  Tracing
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-amber-800 transition-colors">
                Trace Letter {letter.name_english}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Guide your pencil along the curves of <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span>!
              </p>
            </Link>

            {/* 2. Balloon Pop */}
            <Link
              to={`/games/balloon-pop?letter=${letter.id}`}
              className="group bg-gradient-to-br from-rose-50 to-pink-100 border-2 border-rose-200 hover:border-rose-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🎈</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  Arcade
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-rose-800 transition-colors">
                Pop {letter.name_english} Balloons
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Spot and pop only balloons floating with <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span>!
              </p>
            </Link>

            {/* 3. Letter Safari */}
            <Link
              to={`/games/letter-safari?letter=${letter.id}`}
              className="group bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🦁</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                  Safari
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-emerald-800 transition-colors">
                {letter.name_english} Safari Hunt
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Explore the savanna and uncover hidden <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span> tracks.
              </p>
            </Link>

            {/* 4. Letter Catcher */}
            <Link
              to={`/games/letter-catcher?letter=${letter.id}`}
              className="group bg-gradient-to-br from-sky-50 to-blue-100 border-2 border-sky-200 hover:border-sky-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🧺</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-200 text-sky-800">
                  Action
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-sky-800 transition-colors">
                Catch the {letter.name_english} Stars
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Catch falling letter <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span> gems into your magic basket!
              </p>
            </Link>

            {/* 5. Shape & Connector */}
            <Link
              to={`/games/shape-match?letter=${letter.id}`}
              className="group bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-200 hover:border-purple-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🧩</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                  Shaping
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-purple-800 transition-colors">
                Connect {letter.name_english} Forms
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Match isolated, initial, medial, and final forms of <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span>.
              </p>
            </Link>

            {/* 6. Picture Match */}
            <Link
              to={`/games/letter-picture-match?letter=${letter.id}`}
              className="group bg-gradient-to-br from-yellow-50 to-amber-100 border-2 border-yellow-200 hover:border-yellow-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">🖼️</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
                  Vocabulary
                </span>
              </div>
              <h3 className="font-bold text-gray-800 group-hover:text-yellow-800 transition-colors">
                {letter.name_english} Word Match
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Match words starting with <span className="font-arabic font-bold text-sm" dir="rtl">{letter.letter}</span> to colorful illustrations!
              </p>
            </Link>
          </div>
        </motion.section>

        {/* ── Practice button ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="text-center pt-2"
        >
          <Link
            to="/games"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
          >
            <Gamepad2 className="w-6 h-6" />
            Explore Full Arcade (24+ Games) 🚀
          </Link>
        </motion.div>

        {/* ── Prev / Next navigation ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between gap-4 mt-4"
        >
          {prevLetter ? (
            <button
              onClick={() => navigate(`/letter/${prevLetter.id}`)}
              className="flex items-center gap-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 font-bold px-5 py-3 rounded-2xl shadow-sm transition-all hover:shadow hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-arabic text-2xl" dir="rtl">{prevLetter.letter}</span>
              <span className="text-sm">{prevLetter.name_english}</span>
            </button>
          ) : (
            <div />
          )}

          {nextLetter ? (
            <button
              onClick={() => navigate(`/letter/${nextLetter.id}`)}
              className="flex items-center gap-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 font-bold px-5 py-3 rounded-2xl shadow-sm transition-all hover:shadow hover:scale-105"
            >
              <span className="text-sm">{nextLetter.name_english}</span>
              <span className="font-arabic text-2xl" dir="rtl">{nextLetter.letter}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}
        </motion.div>
      </div>
    </div>
  )
}
