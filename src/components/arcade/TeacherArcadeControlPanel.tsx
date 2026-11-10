import { useState } from 'react'
import {
  Gamepad2,
  Play,
  Pause,
  Lightbulb,
  RotateCcw,
  FastForward,
  Clock,
  Lock,
  Unlock,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import {
  ARCADE_LEVELS,
  type ArcadeDifficulty,
  type ArcadeLetterMode,
} from '@/data/arcadeLevels'
import {
  sendArcadeClassroomCommand,
  sendArcadeStudentCommand,
  type ArcadeTeacherDirective,
} from '@/hooks/useArcadeTeacherControl'
import { useSound } from '@/hooks/useSound'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface TeacherArcadeControlPanelProps {
  mode: 'student' | 'classroom'
  studentId?: string
  studentName?: string
  roomCode?: string
  initialLetterId?: string
  initialLevel?: number
  currentDifficulty?: ArcadeDifficulty
  currentLetterMode?: ArcadeLetterMode
  currentPaused?: boolean
  compact?: boolean
  onCommandSent?: (summary: string) => void
}

export default function TeacherArcadeControlPanel({
  mode,
  studentId,
  studentName,
  roomCode = 'LEVEL-1',
  initialLetterId = 'alef',
  initialLevel = 1,
  currentDifficulty = 'adaptive',
  currentLetterMode = 'mixed',
  currentPaused = false,
  compact = false,
  onCommandSent,
}: TeacherArcadeControlPanelProps) {
  const { playStar, playClick } = useSound()

  const [letterId, setLetterId] = useState(initialLetterId || 'alef')
  const [level, setLevel] = useState(initialLevel || 1)
  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>(currentDifficulty)
  const [letterMode, setLetterMode] = useState<ArcadeLetterMode>(currentLetterMode)
  const [waveSeconds, setWaveSeconds] = useState<number>(10)
  const [paused, setPaused] = useState<boolean>(currentPaused)
  const [lockedToLevel, setLockedToLevel] = useState<boolean>(false)
  const [strictSequential, setStrictSequential] = useState<boolean>(false)
  const [toast, setToast] = useState<string | null>(null)

  const dispatchCommand = async (cmd: ArcadeTeacherDirective, msg: string) => {
    playClick()
    if (mode === 'student' && studentId) {
      await sendArcadeStudentCommand(studentId, cmd)
    } else {
      await sendArcadeClassroomCommand(roomCode, cmd)
    }
    setToast(msg)
    onCommandSent?.(msg)
    setTimeout(() => setToast(null), 2800)
  }

  const handleLaunchLevel = async () => {
    playStar()
    const levelInfo = ARCADE_LEVELS.find(l => l.level === level)
    await dispatchCommand(
      {
        letterId,
        level,
        difficulty,
        letterMode,
        waveSeconds,
        paused: false,
        lockToLevel: lockedToLevel ? level : null,
        strictSequential,
        autoNavigate: true,
        commandSource: 'teacher_panel',
      },
      `Launched Level ${level} (${levelInfo?.title || ''}) for ${mode === 'student' ? studentName || 'student' : `Room ${roomCode}`}!`
    )
    setPaused(false)
  }

  const handleTogglePause = async () => {
    const nextPaused = !paused
    setPaused(nextPaused)
    await dispatchCommand(
      { paused: nextPaused },
      nextPaused ? 'Paused arcade game ⏸️' : 'Resumed arcade game ▶️'
    )
  }

  const handleSendHint = async () => {
    playStar()
    await dispatchCommand(
      { hintSeq: Date.now() },
      'Sent golden answer hint 💡'
    )
  }

  const handleBonusTime = async () => {
    playStar()
    await dispatchCommand(
      { bonusTimeSec: 5, bonusTimeSeq: Date.now() },
      'Added +5s bonus time ⏱️'
    )
  }

  const handleNextWave = async () => {
    await dispatchCommand(
      { nextWaveSeq: Date.now() },
      'Advanced to next wave ⏭️'
    )
  }

  const handleRestartLevel = async () => {
    await dispatchCommand(
      { restartSeq: Date.now(), paused: false },
      'Restarted current level 🔄'
    )
    setPaused(false)
  }

  const handleToggleLockLevel = async () => {
    const nextLock = !lockedToLevel
    setLockedToLevel(nextLock)
    await dispatchCommand(
      {
        lockToLevel: nextLock ? level : null,
        unlockAll: !nextLock,
      },
      nextLock ? `Locked learner to Level ${level} 🔒` : 'Unlocked all 10 levels 🔓'
    )
  }

  const handleToggleStrictSeq = async () => {
    const nextSeq = !strictSequential
    setStrictSequential(nextSeq)
    await dispatchCommand(
      { strictSequential: nextSeq },
      nextSeq ? 'Strict 1→10 unlock order ON 🔐' : 'Free level selection ON 🔓'
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border space-y-3',
        compact
          ? 'bg-slate-950 border-slate-800 p-3 text-white'
          : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/40 p-5 text-white shadow-xl'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              {mode === 'student' ? `10-Level Arcade Control (${studentName || 'Student'})` : `Room ${roomCode} Arcade Commander`}
            </h4>
            <p className="text-[10px] text-slate-400">
              Monitor & control letter, level 1–10, difficulty, timer, hints & locks
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Live Control Ready
        </span>
      </div>

      {/* Config Selectors */}
      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5')}>
        {/* Target Arabic Letter */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Arabic Letter
          </label>
          <select
            value={letterId}
            onChange={e => setLetterId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {ARABIC_LETTERS.map(l => (
              <option key={l.id} value={l.id}>
                {l.letter} — {l.name_english} ({l.name_arabic})
              </option>
            ))}
          </select>
        </div>

        {/* Arcade Level 1..10 */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Arcade Level (1–10)
          </label>
          <select
            value={level}
            onChange={e => setLevel(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {ARCADE_LEVELS.map(l => (
              <option key={l.level} value={l.level}>
                L{l.level}: {l.icon} {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={e => {
              const next = e.target.value as ArcadeDifficulty
              setDifficulty(next)
              dispatchCommand({ difficulty: next }, `Difficulty set to ${next}`)
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="adaptive">Adaptive (Simple → Hard)</option>
            <option value="simple">Simple</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Letter vs Types Mode */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Letter / Types Mode
          </label>
          <select
            value={letterMode}
            onChange={e => {
              const next = e.target.value as ArcadeLetterMode
              setLetterMode(next)
              dispatchCommand({ letterMode: next }, `Mode set to ${next}`)
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="mixed">Mixed (Both)</option>
            <option value="more-letters">From More Letters</option>
            <option value="letter-types">That Letter Types/Forms</option>
          </select>
        </div>

        {/* Wave Timer Seconds */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">
            Touch Timer
          </label>
          <select
            value={waveSeconds}
            onChange={e => {
              const sec = Number(e.target.value)
              setWaveSeconds(sec)
              dispatchCommand({ waveSeconds: sec }, `Wave timer set to ${sec}s`)
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value={7}>7s (Fast)</option>
            <option value={10}>10s (Default)</option>
            <option value={15}>15s (Gentle)</option>
            <option value={20}>20s (Guided)</option>
          </select>
        </div>
      </div>

      {/* Primary Launch + Live Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="primary"
          onClick={handleLaunchLevel}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Launch L{level} Now</span>
        </Button>

        <button
          type="button"
          onClick={handleTogglePause}
          className={cn(
            'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors',
            paused
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
          )}
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          type="button"
          onClick={handleSendHint}
          className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-600/50 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Hint 💡</span>
        </button>

        <button
          type="button"
          onClick={handleBonusTime}
          className="px-2.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/50 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>+5s</span>
        </button>

        <button
          type="button"
          onClick={handleNextWave}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Next Wave</span>
        </button>

        <button
          type="button"
          onClick={handleRestartLevel}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>

        <button
          type="button"
          onClick={handleToggleLockLevel}
          className={cn(
            'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors',
            lockedToLevel
              ? 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          )}
        >
          {lockedToLevel ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{lockedToLevel ? `Locked to L${level}` : 'Lock Level'}</span>
        </button>

        <button
          type="button"
          onClick={handleToggleStrictSeq}
          className={cn(
            'px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors',
            strictSequential
              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          )}
        >
          <span>{strictSequential ? 'Sequential 1→10 🔒' : 'Free Levels 🔓'}</span>
        </button>
      </div>

      {toast && (
        <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold animate-pulse">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
