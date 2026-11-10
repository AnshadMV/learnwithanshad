import { motion } from 'framer-motion'
import { Lock, Play, Star, ShieldAlert, Sliders, Sparkles, CheckCircle2, Compass } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  ARCADE_LEVELS,
  type ArcadeDifficulty,
  type ArcadeLetterMode,
} from '@/data/arcadeLevels'
import type { LetterArcadeSummary } from '@/hooks/useArcadeProgress'
import { cn } from '@/lib/utils'

interface ArcadeLevelMapProps {
  letterId: string
  onChangeLetter: (letterId: string) => void
  difficulty: ArcadeDifficulty
  onChangeDifficulty: (d: ArcadeDifficulty) => void
  letterMode: ArcadeLetterMode
  onChangeLetterMode: (m: ArcadeLetterMode) => void
  waveSeconds: number
  onChangeWaveSeconds: (sec: number) => void
  summary: LetterArcadeSummary
  lockToLevel: number | null
  strictSequential: boolean
  isLevelLocked: (level: number) => boolean
  onSelectLevel: (level: number) => void
}

export default function ArcadeLevelMap({
  letterId,
  onChangeLetter,
  difficulty,
  onChangeDifficulty,
  letterMode,
  onChangeLetterMode,
  waveSeconds,
  onChangeWaveSeconds,
  summary,
  lockToLevel,
  strictSequential,
  isLevelLocked,
  onSelectLevel,
}: ArcadeLevelMapProps) {
  const activeLetter = getLetterById(letterId) || ARABIC_LETTERS[0]

  return (
    <div className="space-y-6">
      {/* Selected Letter & Mastery Overview Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-2xl border-2 border-indigo-400/30 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-slate-950 flex flex-col items-center justify-center shadow-xl border-4 border-white/40 shrink-0">
              <span className="font-arabic text-5xl sm:text-6xl font-black leading-none" dir="rtl">
                {activeLetter.letter}
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider mt-1">
                #{activeLetter.order_index}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>10-Level Arabic Letter Arcade</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-display">
                {activeLetter.name_english}{' '}
                <span className="font-arabic text-amber-300" dir="rtl">
                  ({activeLetter.name_arabic})
                </span>{' '}
                Quest
              </h1>
              <p className="text-blue-200 text-xs sm:text-sm max-w-xl">
                Master all 4 forms and harakat of <strong className="text-white">{activeLetter.name_english}</strong> across 10 unique Wordwall-inspired arcade challenges — from 10-second Mole Whack to Cosmic Arrow Maze and Boss Arena!
              </p>
            </div>
          </div>

          {/* Progress Counter + Quick Continue */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 shrink-0 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-5 py-3 flex items-center gap-5 w-full justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-blue-200">Levels Done</div>
                <div className="text-2xl font-black text-emerald-300">
                  {summary.completedCount} / 10
                </div>
              </div>
              <div className="w-px h-8 bg-white/15" />
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-blue-200">Arcade Stars</div>
                <div className="text-2xl font-black text-amber-300 flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
                  <span>{summary.totalStars}/30</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectLevel(lockToLevel || summary.nextRecommendedLevel || 1)}
              className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>
                {lockToLevel
                  ? `Play Teacher Assigned Level ${lockToLevel}`
                  : summary.completedCount > 0
                  ? `Play Level ${summary.nextRecommendedLevel}`
                  : 'Start Level 1 (10 Waves)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Lock Notice */}
      {(lockToLevel || strictSequential) && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber-900 font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {lockToLevel
                ? `Classroom Mode: Teacher locked access to Level ${lockToLevel} for focused practice.`
                : `Classroom Mode: Sequential progression enabled — complete each level to unlock the next!`}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] uppercase font-black shrink-0">
            Teacher Controlled
          </span>
        </div>
      )}

      {/* 28 Arabic Letters Selector Ribbon */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-blue-100 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-brand-blue" />
            Choose Any Arabic Letter (All 28 Letters Have 10 Levels!)
          </span>
          <span className="text-xs font-bold text-brand-blue">
            Selected: <span className="font-arabic text-base" dir="rtl">{activeLetter.letter}</span> ({activeLetter.name_english})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {ARABIC_LETTERS.map(l => {
            const isSel = l.id === letterId
            return (
              <button
                key={l.id}
                onClick={() => onChangeLetter(l.id)}
                className={cn(
                  'px-2.5 py-1.5 rounded-xl border-2 transition-all flex flex-col items-center min-w-[44px]',
                  isSel
                    ? 'bg-brand-blue text-white border-brand-blue shadow-md scale-105'
                    : 'bg-sky/40 text-gray-800 border-blue-100 hover:border-blue-300 hover:bg-blue-50'
                )}
                title={`${l.name_english} (${l.name_arabic})`}
              >
                <span className="font-arabic text-xl font-bold leading-none" dir="rtl">
                  {l.letter}
                </span>
                <span className={cn('text-[9px] font-bold mt-0.5', isSel ? 'text-blue-100' : 'text-gray-400')}>
                  {l.name_english}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Difficulty & Mode Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-card border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Difficulty Option */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-2">
            <Sliders className="w-3.5 h-3.5 text-brand-blue" />
            <span>Difficulty Option</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'adaptive', label: 'Auto' },
                { id: 'simple', label: 'Simple' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Hard' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => onChangeDifficulty(opt.id)}
                className={cn(
                  'py-2 px-1.5 rounded-xl text-xs font-extrabold transition-all border',
                  difficulty === opt.id
                    ? opt.id === 'hard'
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : opt.id === 'medium'
                      ? 'bg-amber-500 text-white border-amber-500 shadow'
                      : opt.id === 'simple'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow'
                      : 'bg-brand-blue text-white border-brand-blue shadow'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {difficulty === 'adaptive'
              ? 'Starts Simple, then ramps to Medium & Hard across waves!'
              : `Locked to ${difficulty} challenge mode.`}
          </p>
        </div>

        {/* Letter Scope / Types Option */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 block mb-2">
            Letter vs Types Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'mixed', label: 'Mixed' },
                { id: 'more-letters', label: 'More Letters' },
                { id: 'letter-types', label: 'Letter Types' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => onChangeLetterMode(opt.id)}
                className={cn(
                  'py-2 px-1.5 rounded-xl text-[11px] font-extrabold transition-all border',
                  letterMode === opt.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {letterMode === 'mixed'
              ? 'Spot the letter among other letters & harakat/forms.'
              : letterMode === 'more-letters'
              ? 'Find target Arabic letter among many alphabet letters.'
              : 'Distinguish initial, medial, final, fatha, kasra & damma forms.'}
          </p>
        </div>

        {/* Touch Timer Option */}
        <div>
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 block mb-2">
            Touch Wave Timer
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[7, 10, 15, 20].map(sec => (
              <button
                key={sec}
                onClick={() => onChangeWaveSeconds(sec)}
                className={cn(
                  'py-2 px-1.5 rounded-xl text-xs font-extrabold transition-all border',
                  waveSeconds === sec
                    ? 'bg-amber-500 text-white border-amber-500 shadow'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                )}
              >
                {sec}s
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Default 10s quick touch per wave (teacher adjustable!).
          </p>
        </div>
      </div>

      {/* 10 Levels Quest Map Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {ARCADE_LEVELS.map((lvl, idx) => {
          const rec = summary.levels[lvl.level]
          const locked = isLevelLocked(lvl.level)
          const isRecommended = !locked && lvl.level === summary.nextRecommendedLevel && !rec?.completed

          return (
            <motion.button
              key={lvl.level}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={locked ? undefined : { y: -4, scale: 1.02 }}
              whileTap={locked ? undefined : { scale: 0.98 }}
              disabled={locked}
              onClick={() => !locked && onSelectLevel(lvl.level)}
              className={cn(
                'relative text-left rounded-3xl p-4 border-2 transition-all flex flex-col justify-between min-h-[215px] overflow-hidden',
                locked
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-75'
                  : isRecommended
                  ? 'bg-white border-amber-400 ring-4 ring-amber-300/40 shadow-xl'
                  : rec?.completed
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-card hover:shadow-card-hover'
                  : 'bg-white border-blue-100 hover:border-brand-blue shadow-card hover:shadow-card-hover'
              )}
            >
              {/* Top Gradient Accent Ribbon */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-2 bg-gradient-to-r',
                  locked ? 'from-gray-300 to-gray-400' : lvl.gradient
                )}
              />

              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider',
                      locked
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-slate-900 text-white'
                    )}
                  >
                    Level {lvl.level}
                  </span>

                  {locked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : rec?.completed ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </span>
                  ) : isRecommended ? (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                      Next Up!
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm bg-gradient-to-br text-white',
                      locked ? 'from-gray-300 to-gray-400' : lvl.gradient
                    )}
                  >
                    {lvl.icon}
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold uppercase text-gray-400">
                      {lvl.gameStyle}
                    </div>
                    <h3 className="font-black text-sm text-gray-800 leading-tight">
                      {lvl.title}
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug">
                  {lvl.subtitle}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-brand-blue">
                    {lvl.badge}
                  </span>
                  {lvl.supportsArrows && (
                    <span className="text-purple-600 font-black">▲▼◀▶</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={cn(
                          'w-4 h-4',
                          (rec?.stars || 0) >= s
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-black',
                      locked ? 'text-gray-400' : 'text-brand-blue'
                    )}
                  >
                    {locked ? 'Locked' : rec?.bestScore ? `Best: ${rec.bestScore}` : 'Play →'}
                  </span>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
