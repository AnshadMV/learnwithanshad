/**
 * Letter Group Practice Arena 👥
 *
 * Dedicated multi-letter learning environment supporting curated 3, 4, and 5
 * letter groups, or custom parent/teacher letter selections.
 */
import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, Play, Check, Sparkles, Filter, RefreshCw } from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import { LETTER_GROUPS, LETTER_PEDAGOGY, type LetterGroup } from '@/data/letterPedagogy'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function LetterGroupArenaPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const presetParam = searchParams.get('preset')
  const lettersParam = searchParams.get('letters')

  // Selected mode: 'preset' vs 'custom'
  const [mode, setMode] = useState<'preset' | 'custom'>(presetParam ? 'preset' : 'preset')

  // Active preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presetParam || LETTER_GROUPS[1].id // default: Sister Dots (ba, ta, tha)
  )

  // Custom selected letter IDs (must be 3 to 5)
  const [customLetterIds, setCustomLetterIds] = useState<string[]>(() => {
    if (lettersParam) {
      const parsed = lettersParam.split(',').filter(id => ARABIC_LETTERS.some(l => l.id === id))
      if (parsed.length >= 3 && parsed.length <= 5) return parsed
    }
    return ['ba', 'ta', 'tha']
  })

  // Selected letters depending on mode
  const currentLetters = useMemo(() => {
    if (mode === 'preset') {
      const grp = LETTER_GROUPS.find(g => g.id === selectedPresetId) || LETTER_GROUPS[0]
      return grp.letterIds.map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
    } else {
      return customLetterIds.map(id => ARABIC_LETTERS.find(l => l.id === id)!).filter(Boolean)
    }
  }, [mode, selectedPresetId, customLetterIds])

  const selectedPreset = LETTER_GROUPS.find(g => g.id === selectedPresetId)

  // Toggle letter in custom selection
  const handleToggleLetter = (letterId: string) => {
    if (customLetterIds.includes(letterId)) {
      if (customLetterIds.length <= 3) {
        // Can't go below 3
        return
      }
      setCustomLetterIds(prev => prev.filter(id => id !== letterId))
    } else {
      if (customLetterIds.length >= 5) {
        // Can't exceed 5
        return
      }
      setCustomLetterIds(prev => [...prev, letterId])
    }
  }

  const queryParamStr = useMemo(() => {
    if (mode === 'preset') {
      return `preset=${selectedPresetId}`
    } else {
      return `letters=${customLetterIds.join(',')}`
    }
  }, [mode, selectedPresetId, customLetterIds])

  // Group games catalog
  const groupGames = [
    {
      slug: 'sister-showdown',
      title: 'Sister Showdown',
      icon: '🥊',
      color: '#7C3AED',
      bg: 'from-purple-500 to-indigo-600',
      description: 'Rapid-fire letter flashcards! Identify letters under time pressure by dot pattern.',
      tag: 'Speed & Reflex',
    },
    {
      slug: 'conveyor-sorter',
      title: 'Conveyor Belt Sorter',
      icon: '📦',
      color: '#0891B2',
      bg: 'from-cyan-500 to-teal-600',
      description: 'Incoming cargo factory! Route words and letters into the matching letter chutes.',
      tag: 'Sorting & Vocab',
    },
    {
      slug: 'train-sequencer',
      title: 'Alphabet Train Sequencer',
      icon: '🚂',
      color: '#DC2626',
      bg: 'from-amber-500 to-red-600',
      description: 'Couple scrambled letter flatcars onto the tracks in the correct alphabetical order.',
      tag: 'Letter Ordering',
    },
    {
      slug: 'desert-caravan',
      title: 'Desert Caravan Sorter',
      icon: '🐪',
      color: '#D97706',
      bg: 'from-amber-600 to-yellow-600',
      description: 'Sort and load cargo onto desert camels stamped with the group letters.',
      tag: 'Arcade Sorter',
    },
    {
      slug: 'letter-bingo',
      title: 'Letter Bingo',
      icon: '🎱',
      color: '#EC4899',
      bg: 'from-pink-500 to-rose-600',
      description: 'Audio letter calls! Listen and mark matching letters on your bingo board.',
      tag: 'Listening Bingo',
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>All Games</span>
        </Button>
        <span className="text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
          Letter Group Arena
        </span>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 font-bold text-sm">
          <Users className="w-4 h-4" />
          <span>Multi-Letter Comparative Practice</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#243247] font-display">
          3, 4 & 5 Letter Group Arena 👥
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Master Arabic letters by comparing related sets! Focus on dot differences, cursive connections, and alphabetical order.
        </p>
      </div>

      {/* ── Mode Switcher ── */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex gap-2">
          <button
            onClick={() => setMode('preset')}
            className={cn(
              'px-6 py-2.5 rounded-xl font-bold text-sm transition-all',
              mode === 'preset'
                ? 'bg-white text-teal-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            🌟 Curated Groups (7 Presets)
          </button>
          <button
            onClick={() => setMode('custom')}
            className={cn(
              'px-6 py-2.5 rounded-xl font-bold text-sm transition-all',
              mode === 'custom'
                ? 'bg-white text-teal-700 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            ✏️ Custom 3–5 Letter Picker
          </button>
        </div>
      </div>

      {/* ── Mode 1: Curated Groups Selector ── */}
      {mode === 'preset' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Choose a Curated Study Group:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {LETTER_GROUPS.map(group => {
              const isSelected = selectedPresetId === group.id
              return (
                <motion.div
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedPresetId(group.id)
                    setSearchParams({ preset: group.id })
                  }}
                  className={cn(
                    'p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between',
                    isSelected
                      ? 'border-teal-500 bg-teal-50/80 shadow-md ring-2 ring-teal-200'
                      : 'border-gray-200 bg-white hover:border-teal-300'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{group.emoji}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                        {group.letterIds.length} Letters
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">{group.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{group.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    {group.letterIds.map(lid => {
                      const l = ARABIC_LETTERS.find(x => x.id === lid)
                      return l ? (
                        <span
                          key={lid}
                          className={cn(
                            'font-arabic text-xl font-bold px-2 py-0.5 rounded-lg border',
                            isSelected
                              ? 'bg-teal-500 text-white border-teal-600'
                              : 'bg-gray-50 text-gray-800 border-gray-200'
                          )}
                          dir="rtl"
                        >
                          {l.letter}
                        </span>
                      ) : null
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Mode 2: Custom Letter Picker ── */}
      {mode === 'custom' && (
        <div className="bg-white rounded-3xl p-6 shadow-card border-2 border-teal-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Pick Any 3, 4, or 5 Letters:</h2>
              <p className="text-xs text-gray-500">
                Click letters on the alphabet grid below to add or remove them from your custom practice set.
              </p>
            </div>
            <span className={cn(
              'text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-auto',
              customLetterIds.length >= 3 && customLetterIds.length <= 5
                ? 'bg-teal-100 text-teal-800'
                : 'bg-amber-100 text-amber-800'
            )}>
              Selected: {customLetterIds.length} / 5 (Min 3)
            </span>
          </div>

          {/* 28 Letters Grid */}
          <div className="grid grid-cols-7 gap-2">
            {ARABIC_LETTERS.map(l => {
              const isSelected = customLetterIds.includes(l.id)
              return (
                <button
                  key={l.id}
                  onClick={() => handleToggleLetter(l.id)}
                  className={cn(
                    'p-3 rounded-2xl flex flex-col items-center justify-center border-2 transition-all',
                    isSelected
                      ? 'bg-teal-500 border-teal-600 text-white shadow-md scale-105'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-teal-300 hover:bg-teal-50/50'
                  )}
                >
                  <span className="font-arabic text-3xl font-black" dir="rtl">{l.letter}</span>
                  <span className={cn('text-[10px] font-bold mt-1', isSelected ? 'text-teal-100' : 'text-gray-500')}>
                    {l.name_english}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active Letter Set Showcase ── */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="text-sm font-bold uppercase tracking-wider text-teal-200">
              Active Practice Set ({currentLetters.length} Letters)
            </span>
          </div>
          {mode === 'preset' && selectedPreset && (
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">
              {selectedPreset.name}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 flex-wrap py-2">
          {currentLetters.map(l => {
            const ped = LETTER_PEDAGOGY[l.id]
            const dotLabel = !ped || ped.dotsCount === 0
              ? 'No dots'
              : `${ped.dotsCount} dot${ped.dotsCount > 1 ? 's' : ''} ${ped.dotPosition}`

            return (
              <div
                key={l.id}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-center min-w-[100px] flex flex-col items-center"
              >
                <span className="font-arabic text-6xl font-black drop-shadow" dir="rtl">
                  {l.letter}
                </span>
                <span className="text-sm font-bold text-white mt-1">
                  {l.name_english}
                </span>
                <span className="text-[10px] text-teal-200 font-semibold bg-white/10 px-2 py-0.5 rounded-full mt-1">
                  {dotLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Launch Group Games ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#243247] flex items-center gap-2">
            <span>🎮 Play Group Games for this Set</span>
          </h2>
          <span className="text-xs font-semibold text-gray-500">
            All games run with the {currentLetters.length} selected letters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {groupGames.map(game => (
            <div
              key={game.slug}
              className="bg-white rounded-3xl p-5 shadow-card border-2 border-gray-100 flex flex-col justify-between hover:border-teal-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${game.color}20` }}
                  >
                    <span>{game.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                    {game.tag}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-teal-600 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                  {game.description}
                </p>
              </div>

              <Button
                variant="primary"
                onClick={() => navigate(`/games/${game.slug}?${queryParamStr}`)}
                className="w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play with this Group</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
