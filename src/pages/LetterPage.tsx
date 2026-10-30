import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Volume2, ChevronLeft, ChevronRight, ArrowLeft, Gamepad2, Users } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import { cn } from '@/lib/utils'
import { ALL_GAMES } from '@/pages/GamesLibraryPage'
import type { SkillTag } from '@/components/game/GameCard'
import { getGroupsForLetter } from '@/data/letterPedagogy'

const FORM_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', label: 'bg-blue-500' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', label: 'bg-green-500' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', label: 'bg-yellow-500' },
  { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'bg-red-500' },
]

const SKILL_SECTIONS: { tag: SkillTag; label: string; icon: string; color: string; bg: string }[] = [
  { tag: 'Tracing',     label: 'Handwriting & Tracing',   icon: '✏️', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  { tag: 'Recognition', label: 'Visual Recognition',       icon: '👁️', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  { tag: 'Phonics',     label: 'Phonics & Listening',      icon: '👂', color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200' },
  { tag: 'Forms',       label: 'Letter Forms & Anatomy',   icon: '🧩', color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
  { tag: 'Vocabulary',  label: 'Vocabulary & Spelling',    icon: '📚', color: 'text-yellow-800',  bg: 'bg-yellow-50 border-yellow-200' },
  { tag: 'Arcade',      label: 'Arcade & Reflex',          icon: '⚡', color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200' },
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
  const [activeSkill, setActiveSkill] = useState<SkillTag | 'All'>('All')

  const letter = useMemo(() => ARABIC_LETTERS.find(l => l.id === id), [id])
  const letterIndex = useMemo(
    () => ARABIC_LETTERS.findIndex(l => l.id === id),
    [id],
  )

  const prevLetter = letterIndex > 0 ? ARABIC_LETTERS[letterIndex - 1] : null
  const nextLetter = letterIndex < ARABIC_LETTERS.length - 1 ? ARABIC_LETTERS[letterIndex + 1] : null

  const gradient = HERO_GRADIENTS[(letterIndex >= 0 ? letterIndex : 0) % HERO_GRADIENTS.length]

  // Letter-scoped games (all games that support letter scope)
  const letterGames = useMemo(
    () => ALL_GAMES.filter(g => g.supportsLetterScope),
    [],
  )

  // Filter by active skill tab
  const filteredGames = useMemo(
    () => activeSkill === 'All' ? letterGames : letterGames.filter(g => g.skillTag === activeSkill),
    [letterGames, activeSkill],
  )

  // Related letter groups
  const relatedGroups = useMemo(() => id ? getGroupsForLetter(id) : [], [id])

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

        {/* ── Dynamic Letter-Scoped Game Hub ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="space-y-5"
        >
          {/* Section header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-black text-[#243247] flex items-center gap-2 flex-wrap">
              <span>🎮 Games for</span>
              <span className="font-arabic text-3xl text-brand-blue" dir="rtl">{letter.letter}</span>
              <span className="text-base text-gray-400 font-medium">({letter.name_english})</span>
            </h2>
            <Link
              to={`/games?letter=${letter.id}`}
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              <span>All arcade games →</span>
            </Link>
          </div>

          {/* Skill filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[{ tag: 'All' as const, label: '🎮 All', color: '' }, ...SKILL_SECTIONS.map(s => ({ tag: s.tag, label: `${s.icon} ${s.tag}`, color: '' }))].map(tab => (
              <button
                key={tab.tag}
                onClick={() => setActiveSkill(tab.tag as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap',
                  activeSkill === tab.tag
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Games grid — all letter-scoped games */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGames.map((game, idx) => {
              const skillMeta = SKILL_SECTIONS.find(s => s.tag === game.skillTag)
              return (
                <motion.div
                  key={game.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Link
                    to={`/games/${game.slug}?letter=${letter.id}`}
                    className={cn(
                      'group block p-5 rounded-2xl border-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-1',
                      skillMeta?.bg || 'bg-gray-50 border-gray-200 hover:border-gray-400',
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{game.icon}</span>
                      <span className={cn(
                        'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full',
                        skillMeta ? `bg-white/70 ${skillMeta.color}` : 'bg-white/70 text-gray-600',
                      )}>
                        {skillMeta?.icon} {game.skillTag}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 group-hover:text-brand-blue transition-colors text-sm">
                      {game.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{game.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <span>🎯</span>
                      <span className="font-arabic" dir="rtl">{letter.letter}</span>
                      <span>-focused session</span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <p className="text-xs text-center text-gray-400">
            {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} letter-scoped for{' '}
            <span className="font-arabic font-bold" dir="rtl">{letter.letter}</span>
          </p>
        </motion.section>

        {/* ── Related Letter Groups ── */}
        {relatedGroups.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-black text-[#243247] flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" />
              Practice {letter.name_english} With Related Letters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGroups.map(group => (
                <Link
                  key={group.id}
                  to={`/games/groups?preset=${group.id}`}
                  className="group flex items-start gap-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:border-teal-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <span className="text-3xl mt-0.5">{group.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {group.letterIds.map(lid => {
                        const l2 = ARABIC_LETTERS.find(l => l.id === lid)
                        return l2 ? (
                          <span
                            key={lid}
                            className={cn(
                              'font-arabic text-lg font-bold px-1.5 py-0.5 rounded-lg',
                              lid === letter.id ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 border border-gray-200',
                            )}
                            dir="rtl"
                          >
                            {l2.letter}
                          </span>
                        ) : null
                      })}
                    </div>
                    <p className="text-[10px] text-teal-600 font-bold mt-2 uppercase tracking-wider">
                      {group.focus}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Full Arcade CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center pt-2 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to={`/games?letter=${letter.id}`}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
          >
            <Gamepad2 className="w-6 h-6" />
            Full Arcade for <span className="font-arabic ml-1" dir="rtl">{letter.letter}</span>
          </Link>
          <Link
            to="/games/groups"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-base px-6 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Users className="w-5 h-5" />
            Group Practice Arena
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
