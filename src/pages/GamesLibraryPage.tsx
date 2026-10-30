import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Gamepad2, Search, Users, ChevronDown, ChevronUp, X } from 'lucide-react'
import GameCard from '@/components/game/GameCard'
import type { GameCardInfo, SkillTag, AgeGroup } from '@/components/game/GameCard'
import { cn } from '@/lib/utils'
import { ARABIC_LETTERS } from '@/data/arabicLetters'

// ---------------------------------------------------------------------------
// Full game registry
// ---------------------------------------------------------------------------

export const ALL_GAMES: GameCardInfo[] = [
  // ── Recognition ──────────────────────────────────────────────────────────
  {
    slug: 'letter-safari',
    name: 'Letter Safari',
    description: 'Spot and collect the requested Arabic letter hidden in the safari grid!',
    category: 'Recognition', skillTag: 'Recognition', ageGroup: 'explorer',
    icon: '🔍', color: '#4285F4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-picture-match',
    name: 'Picture Match',
    description: 'Match letters with their lovely pictures and starter sounds!',
    category: 'Recognition', skillTag: 'Vocabulary', ageGroup: 'explorer',
    icon: '🎯', color: '#34A853', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'find-different',
    name: 'Find the Different Letter',
    description: 'Look closely and identify the odd letter in the group!',
    category: 'Recognition', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🕵️', color: '#FBBC05', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'memory-cards',
    name: 'Memory Cards',
    description: 'Flip pairs of colorful cards to find matching Arabic letters!',
    category: 'Recognition', skillTag: 'Recognition', ageGroup: 'explorer',
    icon: '🃏', color: '#EA4335', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-detective',
    name: 'Letter Detective',
    description: 'Count how many target letters are hiding in a mystery line!',
    category: 'Recognition', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🔎', color: '#8B5CF6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-bingo',
    name: 'Letter Bingo',
    description: 'Listen to the letter call and mark your card to shout Bingo!',
    category: 'Recognition', skillTag: 'Phonics', ageGroup: 'builder',
    icon: '🎱', color: '#EC4899', supportsLetterScope: true, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'star-constellation',
    name: 'Star Constellation',
    description: 'Connect luminous stars in stroke order to reveal glowing Arabic letters!',
    category: 'Recognition', skillTag: 'Tracing', ageGroup: 'explorer',
    icon: '🌌', color: '#F59E0B', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'solar-orbit',
    name: 'Solar Orbit Explorer',
    description: 'Align orbiting planets displaying matching letters in deep space!',
    category: 'Recognition', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🪐', color: '#6366F1', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'lantern-glow',
    name: 'Ramadan Lantern Glow',
    description: 'Light up festive lanterns by tapping the correct harakat vowel sound!',
    category: 'Recognition', skillTag: 'Phonics', ageGroup: 'builder',
    icon: '🏮', color: '#D97706', supportsLetterScope: true, supportsGroupScope: false,
  },

  // ── Writing & Forms ───────────────────────────────────────────────────────
  {
    slug: 'trace-letter',
    name: 'Trace the Letter',
    description: 'Follow guided strokes on a digital canvas to write Arabic letters!',
    category: 'Writing', skillTag: 'Tracing', ageGroup: 'explorer',
    icon: '✏️', color: '#4285F4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'connect-dots',
    name: 'Connect the Dots',
    description: 'Follow numbered stars to draw and reveal the Arabic letter shape!',
    category: 'Writing', skillTag: 'Tracing', ageGroup: 'explorer',
    icon: '🔵', color: '#34A853', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'build-letter',
    name: 'Build the Letter',
    description: 'Drag and snap letter piece parts together to assemble the complete letter!',
    category: 'Writing', skillTag: 'Forms', ageGroup: 'builder',
    icon: '🧩', color: '#FBBC05', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'shape-match',
    name: 'Letter Shape Match',
    description: 'Match isolated, initial, medial, and final forms of each letter!',
    category: 'Writing', skillTag: 'Forms', ageGroup: 'builder',
    icon: '🔷', color: '#EA4335', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'complete-word',
    name: 'Complete the Word',
    description: 'Fill in the missing letter to complete illustrated Arabic words!',
    category: 'Writing', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '📝', color: '#8B5CF6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-puzzle',
    name: 'Arabic Letter Puzzle',
    description: 'Rearrange scrambled quadrant tiles to reassemble the Arabic letter!',
    category: 'Writing', skillTag: 'Recognition', ageGroup: 'explorer',
    icon: '🧸', color: '#EC4899', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'castle-keymaker',
    name: 'Castle Gate Keymaker',
    description: 'Forge magic keys by transforming isolated letter forms into connected shapes!',
    category: 'Writing', skillTag: 'Forms', ageGroup: 'master',
    icon: '🗝️', color: '#D97706', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'cookie-oven',
    name: "Baker's Cookie Oven",
    description: 'Bake Arabic letter cookies by tracing outlines with sweet icing!',
    category: 'Writing', skillTag: 'Tracing', ageGroup: 'explorer',
    icon: '🍪', color: '#F59E0B', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'mosaic-tile',
    name: 'Mosaic Tile Artisan',
    description: 'Decorate palace zellij mosaics by placing letter tiles in the right slots!',
    category: 'Writing', skillTag: 'Forms', ageGroup: 'master',
    icon: '🎨', color: '#0D9488', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'gear-factory',
    name: 'Clockwork Gear Factory',
    description: 'Interlock rotating machine cogs stamped with matching letter forms!',
    category: 'Writing', skillTag: 'Forms', ageGroup: 'master',
    icon: '⚙️', color: '#64748B', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'dot-placement',
    name: 'Dot Placement Workshop',
    description: 'Place the correct number of I\'jam dots onto the naked rasm letter body!',
    category: 'Writing', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '⚫', color: '#7C3AED', supportsLetterScope: true, supportsGroupScope: true, minLetters: 3, maxLetters: 3,
  },

  // ── Listening & Vocabulary ─────────────────────────────────────────────────
  {
    slug: 'listen-choose',
    name: 'Listen and Choose',
    description: 'Listen to the authentic pronunciation and pick the correct letter!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'explorer',
    icon: '👂', color: '#4285F4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'sound-safari',
    name: 'Sound Safari',
    description: 'Identify which friendly animal or item begins with the target sound!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'explorer',
    icon: '🎵', color: '#34A853', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'picture-hunt',
    name: 'Picture Hunt',
    description: 'Find pictures and objects whose Arabic names contain the target letter!',
    category: 'Listening', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '🖼️', color: '#FBBC05', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'word-builder',
    name: 'Word Builder',
    description: 'Drag and arrange Arabic letter blocks in order to form vocabulary words!',
    category: 'Listening', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '🔤', color: '#EA4335', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'listen-match',
    name: 'Listen and Match',
    description: 'Listen to spoken Arabic vocabulary and match it to its picture!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'builder',
    icon: '🎤', color: '#8B5CF6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'position-game',
    name: 'Beginning, Middle, or End?',
    description: 'Where is the letter hiding in this word? Choose its position!',
    category: 'Listening', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '📍', color: '#EC4899', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'fruit-blender',
    name: 'Fruit Juice Blender',
    description: 'Catch fruits whose Arabic names start with the spoken phonetic sound!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'explorer',
    icon: '🍹', color: '#F43F5E', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'market-bazaar',
    name: 'Market Bazaar Trader',
    description: 'Sort market goods into stalls by matching their starting Arabic letter sound!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'builder',
    icon: '🎪', color: '#B45309', supportsLetterScope: true, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'raindrop-rhythm',
    name: 'Raindrop Rhythm',
    description: 'Tap musical raindrops falling from the sky in time with letter beats!',
    category: 'Listening', skillTag: 'Phonics', ageGroup: 'builder',
    icon: '🌧️', color: '#0284C7', supportsLetterScope: true, supportsGroupScope: false,
  },

  // ── Arcade & Challenge ─────────────────────────────────────────────────────
  {
    slug: 'balloon-pop',
    name: 'Letter Balloon Pop',
    description: 'Pop floating balloons carrying the target letter before time runs out!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🎈', color: '#4285F4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-fishing',
    name: 'Letter Fishing',
    description: 'Hook and catch the swimming fish that carry the requested letter!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🎣', color: '#34A853', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'treasure-chest',
    name: 'Treasure Chest Challenge',
    description: 'Solve quick letter questions to unlock five golden padlocks!',
    category: 'Arcade', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🏆', color: '#FBBC05', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'rocket-race',
    name: 'Rocket Letter Race',
    description: 'Fuel your rocket by answering correctly and race to the moon!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'builder',
    icon: '🚀', color: '#EA4335', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'letter-catcher',
    name: 'Letter Catcher',
    description: 'Move your basket left and right to catch falling target letters!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🤸', color: '#8B5CF6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'daily-quest',
    name: 'Daily Letter Quest',
    description: 'Complete a special daily multi-stage letter challenge for star rewards!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'master',
    icon: '⭐', color: '#EC4899', supportsLetterScope: false, supportsGroupScope: false,
  },
  {
    slug: 'desert-caravan',
    name: 'Desert Caravan Sorter',
    description: 'Sort and load cargo boxes onto camels crossing the golden desert dunes!',
    category: 'Arcade', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '🐪', color: '#D97706', supportsLetterScope: true, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'gem-miner',
    name: 'Gem Miner Drill',
    description: 'Drill through crystal caves to mine sparkling Arabic letter gems!',
    category: 'Arcade', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '💎', color: '#8B5CF6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'magic-carpet',
    name: 'Magic Carpet Flight',
    description: 'Steer your carpet through sky rings — catch words containing the target letter!',
    category: 'Arcade', skillTag: 'Vocabulary', ageGroup: 'builder',
    icon: '🧞', color: '#0EA5E9', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'frog-leap',
    name: 'Lilypad Frog Leap',
    description: 'Help the cheerful frog hop across river lilypads with the correct letters!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🐸', color: '#10B981', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'pirate-island',
    name: 'Pirate Island Excavation',
    description: 'Dig up pirate treasure chests stamped with the target letter shape!',
    category: 'Arcade', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🏴‍☠️', color: '#B45309', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'submarine-sonar',
    name: 'Submarine Sonar Ping',
    description: 'Send sonar pings into deep oceans to find target letter sea creatures!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'builder',
    icon: '🚢', color: '#06B6D4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'train-coupler',
    name: 'Train Cargo Coupler',
    description: 'Couple train cars in alphabetical order to get the express rolling!',
    category: 'Arcade', skillTag: 'Forms', ageGroup: 'master',
    icon: '🚂', color: '#EF4444', supportsLetterScope: false, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'kite-flying',
    name: 'Kite Flying Breeze',
    description: 'Steer kites into wind gusts displaying the correct written letter form!',
    category: 'Arcade', skillTag: 'Forms', ageGroup: 'builder',
    icon: '🪁', color: '#14B8A6', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'dolphin-hoop',
    name: 'Dolphin Hoop Acrobat',
    description: 'Direct acrobat dolphins to jump through floating hoops of Arabic letters!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🐬', color: '#06B6D4', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'jungle-vine',
    name: 'Jungle Vine Swinger',
    description: 'Swing a playful monkey through jungle vines marked with target letters!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🐒', color: '#059669', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'critter-whack',
    name: 'Sand Dune Critter Whack',
    description: 'Gently tap cheeky sand jerboas popping out of burrows with target letters!',
    category: 'Arcade', skillTag: 'Arcade', ageGroup: 'explorer',
    icon: '🐹', color: '#D97706', supportsLetterScope: true, supportsGroupScope: false,
  },
  {
    slug: 'rainbow-bridge',
    name: 'Rainbow Bridge Builder',
    description: 'Build stepping stones across the waterfall by placing correct glowing letters!',
    category: 'Arcade', skillTag: 'Recognition', ageGroup: 'builder',
    icon: '🌈', color: '#EC4899', supportsLetterScope: true, supportsGroupScope: false,
  },

  // ── Group Games ───────────────────────────────────────────────────────────
  {
    slug: 'sister-showdown',
    name: 'Sister Showdown',
    description: 'Rapid-fire flashcards — distinguish lookalike letters by their dot patterns!',
    category: 'Group', skillTag: 'Group', ageGroup: 'builder',
    icon: '🥊', color: '#7C3AED', supportsLetterScope: false, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'conveyor-sorter',
    name: 'Conveyor Belt Sorter',
    description: 'Route falling Arabic words into the matching letter chutes — don\'t miss!',
    category: 'Group', skillTag: 'Group', ageGroup: 'builder',
    icon: '📦', color: '#0891B2', supportsLetterScope: false, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
  {
    slug: 'train-sequencer',
    name: 'Alphabet Train Sequencer',
    description: 'Drag scrambled letter train cars onto the track in the correct order!',
    category: 'Group', skillTag: 'Group', ageGroup: 'explorer',
    icon: '🚃', color: '#DC2626', supportsLetterScope: false, supportsGroupScope: true, minLetters: 3, maxLetters: 5,
  },
]

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const SKILL_TABS: { label: string; value: SkillTag | 'All' }[] = [
  { label: '🎮 All', value: 'All' },
  { label: '👁️ Recognition', value: 'Recognition' },
  { label: '✏️ Tracing', value: 'Tracing' },
  { label: '👂 Phonics', value: 'Phonics' },
  { label: '🧩 Forms', value: 'Forms' },
  { label: '📚 Vocabulary', value: 'Vocabulary' },
  { label: '⚡ Arcade', value: 'Arcade' },
  { label: '👥 Group', value: 'Group' },
]

const AGE_TABS: { label: string; value: AgeGroup | 'All' }[] = [
  { label: '🌈 All Ages', value: 'All' },
  { label: '🌱 Explorer (4–5)', value: 'explorer' },
  { label: '🌿 Builder (5–6)', value: 'builder' },
  { label: '🌳 Master (6–7)', value: 'master' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GamesLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [selectedSkill, setSelectedSkill] = useState<SkillTag | 'All'>('All')
  const [selectedAge, setSelectedAge] = useState<AgeGroup | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLetterFilter, setShowLetterFilter] = useState(false)

  // Letter filter from URL or local state
  const activeLetter = searchParams.get('letter') || ''

  const setActiveLetter = (id: string) => {
    if (activeLetter === id) {
      // Deselect
      setSearchParams({})
    } else {
      setSearchParams({ letter: id })
    }
  }

  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter(g => {
      if (selectedSkill !== 'All' && g.skillTag !== selectedSkill) return false
      if (selectedAge !== 'All' && g.ageGroup !== selectedAge && g.ageGroup !== 'all') return false
      if (activeLetter && !g.supportsLetterScope && !g.supportsGroupScope) return false
      if (activeLetter && !g.supportsLetterScope) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        return (
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [selectedSkill, selectedAge, activeLetter, searchQuery])

  const activeLett = ARABIC_LETTERS.find(l => l.id === activeLetter)

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-brand-green font-bold text-sm">
          <Gamepad2 className="w-4 h-4" />
          <span>{ALL_GAMES.length} Distinct Educational Games</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#243247] font-display">
          Educational Games Arcade 🎮
        </h1>
        <p className="text-gray-600 text-lg">
          Master Arabic letters through playful games — from flying carpets to deep-sea sonars and constellation quests!
        </p>
      </div>

      {/* ── Group Practice Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/games/groups')}
        className="cursor-pointer bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between gap-4 hover:scale-[1.01] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl">👥</div>
          <div>
            <h2 className="text-2xl font-black">Letter Group Practice Arena</h2>
            <p className="text-white/80 text-sm mt-0.5">
              Study 3, 4, or 5 related letters together — Sister Showdown, Conveyor Sorter, Train Sequencer & more!
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 px-5 py-2.5 rounded-2xl font-bold text-sm transition-colors">
          Open Arena →
        </div>
      </motion.div>

      {/* ── Filters Panel ── */}
      <div className="bg-white rounded-3xl p-5 shadow-card space-y-4">
        {/* Skill tabs */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Learning Focus</p>
          <div className="flex gap-2 flex-wrap">
            {SKILL_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSelectedSkill(tab.value as any)}
                className={cn(
                  'px-4 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                  selectedSkill === tab.value
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Age tier tabs */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Age Tier</p>
          <div className="flex gap-2 flex-wrap">
            {AGE_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setSelectedAge(tab.value as any)}
                className={cn(
                  'px-4 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap',
                  selectedAge === tab.value
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Letter Filter Toggle Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue"
            />
          </div>

          {/* Letter filter toggle */}
          <button
            onClick={() => setShowLetterFilter(v => !v)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all',
              activeLetter
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <span className="font-arabic text-base">{activeLett ? activeLett.letter : 'أ'}</span>
            {activeLetter ? `Filter: ${activeLett?.name_english}` : 'Filter by Letter'}
            {showLetterFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {activeLetter && (
              <X
                className="w-3.5 h-3.5 ml-1"
                onClick={e => { e.stopPropagation(); setSearchParams({}) }}
              />
            )}
          </button>
        </div>

        {/* Letter Quick-Filter Bar */}
        <AnimatePresence>
          {showLetterFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Select a Letter to Filter Games
              </p>
              <div className="flex flex-wrap gap-2">
                {ARABIC_LETTERS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setActiveLetter(l.id)}
                    className={cn(
                      'w-10 h-10 rounded-xl font-arabic text-xl font-bold transition-all border-2',
                      activeLetter === l.id
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-110'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                    )}
                    dir="rtl"
                    title={l.name_english}
                  >
                    {l.letter}
                  </button>
                ))}
              </div>

              {activeLetter && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
                >
                  <span>🎯</span>
                  <span>
                    Showing games letter-scoped for{' '}
                    <span className="font-arabic text-lg" dir="rtl">{activeLett?.letter}</span>{' '}
                    ({activeLett?.name_english})
                  </span>
                  <button
                    onClick={() => setSearchParams({})}
                    className="ml-auto text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded-lg font-bold"
                  >
                    Clear
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-gray-500">
          {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''} found
        </p>
        {(selectedSkill !== 'All' || selectedAge !== 'All' || activeLetter) && (
          <button
            onClick={() => {
              setSelectedSkill('All')
              setSelectedAge('All')
              setSearchParams({})
            }}
            className="text-xs text-blue-500 hover:underline font-bold"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Games Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredGames.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-lg font-bold">No games match these filters</p>
            <p className="text-sm mt-1">Try removing some filters to see more games.</p>
          </div>
        ) : (
          filteredGames.map((game, idx) => (
            <motion.div
              key={game.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.025, 0.4) }}
            >
              <GameCard
                game={game}
                activeLetter={activeLetter ? activeLett?.letter : undefined}
                onClick={() => {
                  const url = activeLetter && game.supportsLetterScope
                    ? `/games/${game.slug}?letter=${activeLetter}`
                    : `/games/${game.slug}`
                  navigate(url)
                }}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
