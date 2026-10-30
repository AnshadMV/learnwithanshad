import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Gamepad2, Globe, Star, Zap, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Rotating letters shown in the hero ──────────────────────────────────────
const HERO_LETTERS = ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س']

const HERO_COLORS = [
  'from-blue-400 to-blue-600',
  'from-red-400 to-red-500',
  'from-yellow-400 to-orange-400',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
]

// ── Static star positions so they don't repaint on every render ──────────────
const STARS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  top: `${Math.round((i * 37 + 11) % 100)}%`,
  left: `${Math.round((i * 53 + 7) % 100)}%`,
  delay: (i * 0.3) % 3,
  duration: 2 + (i % 3),
  size: i % 3 === 0 ? 'text-2xl' : i % 3 === 1 ? 'text-lg' : 'text-sm',
}))

// ── Action cards ─────────────────────────────────────────────────────────────
const ACTION_CARDS = [
  {
    to: '/alphabet',
    icon: BookOpen,
    emoji: '📖',
    label: 'Learn Letters',
    sublabel: 'All 28 Arabic letters',
    bg: 'bg-blue-500',
    shadow: 'shadow-blue-300',
    hover: 'hover:bg-blue-600',
  },
  {
    to: '/games',
    icon: Gamepad2,
    emoji: '🎮',
    label: 'Play Games',
    sublabel: '24 fun games await',
    bg: 'bg-red-500',
    shadow: 'shadow-red-300',
    hover: 'hover:bg-red-600',
  },
  {
    to: '/words',
    icon: Globe,
    emoji: '🌍',
    label: 'Word Explorer',
    sublabel: 'Discover Arabic words',
    bg: 'bg-green-500',
    shadow: 'shadow-green-300',
    hover: 'hover:bg-green-600',
  },
]

// ── Feature badges ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔤', label: '28 Letters', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { icon: '🎮', label: '24 Games', color: 'bg-red-100 text-red-700 border-red-200' },
  { icon: '⭐', label: 'Fun Learning', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { icon: '🎵', label: 'Audio Support', color: 'bg-green-100 text-green-700 border-green-200' },
  { icon: '🏆', label: 'Earn Badges', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { icon: '📱', label: 'Works Anywhere', color: 'bg-pink-100 text-pink-700 border-pink-200' },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [letterIndex, setLetterIndex] = useState(0)
  const [colorIndex, setColorIndex] = useState(0)

  // Rotate through hero letters every 1.5 s
  useEffect(() => {
    const t = setInterval(() => {
      setLetterIndex(prev => (prev + 1) % HERO_LETTERS.length)
      setColorIndex(prev => (prev + 1) % HERO_COLORS.length)
    }, 1500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#EAF5FF] overflow-hidden">
      {/* ── Floating background stars ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {STARS.map(s => (
          <motion.span
            key={s.id}
            className={cn('absolute opacity-30 select-none', s.size)}
            style={{ top: s.top, left: s.left }}
            animate={{ y: [0, -12, 0], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⭐
          </motion.span>
        ))}
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-12 px-4 text-center">
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1.5 rounded-full mb-4 shadow-sm">
            🌟 Learn Arabic with Anshad
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[#243247] leading-tight mb-2">
            Learn Arabic Letters
          </h1>
          <h2 className="text-3xl md:text-5xl font-extrabold text-blue-500 mb-6">
            the Fun Way! 🌟
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-10">
            An exciting journey through the Arabic alphabet — designed especially for young learners!
          </p>
        </motion.div>

        {/* Rotating Arabic letter display */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div className={cn(
            'relative w-44 h-44 md:w-56 md:h-56 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl',
            HERO_COLORS[colorIndex],
          )}>
            {/* Decorative rings */}
            <div className="absolute inset-0 rounded-3xl border-4 border-white/30" />
            <div className="absolute -inset-2 rounded-[2rem] border-2 border-white/10" />

            <AnimatePresence mode="wait">
              <motion.span
                key={letterIndex}
                className="font-arabic text-8xl md:text-9xl text-white drop-shadow-lg leading-none"
                dir="rtl"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {HERO_LETTERS[letterIndex]}
              </motion.span>
            </AnimatePresence>

            {/* Sparkle dots */}
            {['-top-2 -right-2', '-bottom-2 -left-2', 'top-1/2 -right-3'].map((pos, i) => (
              <motion.div
                key={i}
                className={cn('absolute w-4 h-4 bg-yellow-300 rounded-full', pos)}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
              />
            ))}
          </div>
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link
            to="/alphabet"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-xl px-10 py-4 rounded-2xl shadow-lg shadow-blue-300 transition-all duration-200"
          >
            <Zap className="w-6 h-6" />
            Start Learning!
          </Link>
        </motion.div>
      </section>

      {/* ── Action cards ── */}
      <section className="px-4 pb-14 max-w-5xl mx-auto">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-2xl font-bold text-[#243247] mb-6"
        >
          What do you want to do? 🤔
        </motion.h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {ACTION_CARDS.map((card, i) => (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.12, duration: 0.5, type: 'spring', stiffness: 100 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                to={card.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-white shadow-xl transition-colors duration-200',
                  card.bg, card.hover, `shadow-xl ${card.shadow}`,
                )}
              >
                <span className="text-5xl">{card.emoji}</span>
                <span className="text-2xl font-extrabold">{card.label}</span>
                <span className="text-sm font-medium opacity-80">{card.sublabel}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features section ── */}
      <section className="px-4 pb-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h3 className="text-xl font-bold text-[#243247]">Everything you need to learn Arabic</h3>
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-semibold text-sm',
                  f.color,
                )}
              >
                <span className="text-xl">{f.icon}</span>
                {f.label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Bottom wave decoration ── */}
      <div className="relative">
        <svg viewBox="0 0 1440 80" className="w-full fill-blue-500/10" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
        <div className="bg-blue-500/10 text-center py-6 text-slate-500 text-sm">
          <Star className="inline w-4 h-4 text-yellow-500 fill-yellow-400 mr-1" />
          Learn Arabic with Anshad — Made with love for young learners
          <Star className="inline w-4 h-4 text-yellow-500 fill-yellow-400 ml-1" />
        </div>
      </div>
    </div>
  )
}
