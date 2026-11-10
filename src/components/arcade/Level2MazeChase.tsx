import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Lightbulb, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Heart, Check } from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  findMazeNextStep,
  generateMazeRoundChambers,
  getMazeConfig,
  resolveWaveDifficulty,
  type MazeCoord,
} from '@/data/arcadeLevels'
import { useSound } from '@/hooks/useSound'
import { useArabicSpeech } from '@/hooks/useArabicSpeech'
import type { ArcadeLevelProps } from './arcadeTypes'
import { cn, formatDuration } from '@/lib/utils'

const TOTAL_MAZE_ROUNDS = 5

export default function Level2MazeChase({
  letterId,
  difficulty,
  letterMode,
  waveSeconds,
  isPaused,
  hintSeq,
  restartSeq,
  nextWaveSeq,
  bonusTimeSeq,
  bonusTimeSec,
  onAnswer,
  onTelemetry,
  onComplete,
}: ArcadeLevelProps) {
  const { playCoin, playCorrect, playWrong, playBoing, playClick, playStar } = useSound()
  const { speak } = useArabicSpeech()

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]

  const [roundIdx, setRoundIdx] = useState(0)
  const resolvedDiff = useMemo(
    () => resolveWaveDifficulty(difficulty, roundIdx, TOTAL_MAZE_ROUNDS),
    [difficulty, roundIdx]
  )
  const mazeConfig = useMemo(() => getMazeConfig(resolvedDiff), [resolvedDiff])

  const roundData = useMemo(
    () => generateMazeRoundChambers(letterId, roundIdx, mazeConfig, resolvedDiff, letterMode),
    [letterId, roundIdx, mazeConfig, resolvedDiff, letterMode, restartSeq]
  )

  const initialTimer = Math.max(35, waveSeconds * 4)
  const [timeLeft, setTimeLeft] = useState<number>(initialTimer)
  const [hearts, setHearts] = useState<number>(3)
  const [checkCount, setCheckCount] = useState<number>(0)
  const [playerPos, setPlayerPos] = useState<MazeCoord>(mazeConfig.playerStart)
  const [patrolPositions, setPatrolPositions] = useState<MazeCoord[]>(() =>
    mazeConfig.patrols.map(p => p.path[0])
  )
  const [shieldTicks, setShieldTicks] = useState<number>(0)
  const [hintPath, setHintPath] = useState<MazeCoord[]>([])
  const [hintDirLabel, setHintDirLabel] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ text: string; good: boolean } | null>(null)

  const patrolIdxRef = useRef<number[]>(mazeConfig.patrols.map(() => 0))
  const completedRef = useRef(false)
  const roundLockRef = useRef(false)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  // Reset entire Level 2 on restartSeq / letterId
  useEffect(() => {
    setRoundIdx(0)
    setTimeLeft(Math.max(35, waveSeconds * 4))
    setHearts(3)
    setCheckCount(0)
    setHintPath([])
    setHintDirLabel(null)
    setStatusMsg(null)
    setShieldTicks(0)
    completedRef.current = false
    roundLockRef.current = false
    correctRef.current = 0
    totalRef.current = 0
  }, [letterId, restartSeq, waveSeconds])

  // Sync player & patrol start whenever mazeConfig or round changes
  useEffect(() => {
    setPlayerPos(mazeConfig.playerStart)
    patrolIdxRef.current = mazeConfig.patrols.map(() => 0)
    setPatrolPositions(mazeConfig.patrols.map(p => p.path[0]))
    setHintPath([])
    setHintDirLabel(null)
    roundLockRef.current = false
  }, [mazeConfig, roundIdx])

  // Speak target letter on round change
  useEffect(() => {
    if (roundData?.targetChar) {
      speak(roundData.targetChar)
    }
  }, [roundIdx, roundData?.targetChar])

  // Bonus time from teacher
  useEffect(() => {
    if (bonusTimeSeq > 0) {
      setTimeLeft(t => t + (bonusTimeSec || 5))
    }
  }, [bonusTimeSeq, bonusTimeSec])

  // Next wave from teacher
  useEffect(() => {
    if (nextWaveSeq > 0 && !completedRef.current) {
      advanceRound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextWaveSeq])

  // Trigger BFS shortest path hint when hintSeq increments
  const computeAndShowHint = useCallback(() => {
    const targetChamber = roundData.chambers.find(ch => ch.isTarget)
    if (!targetChamber) return
    const { next, path } = findMazeNextStep(mazeConfig.grid, playerPos, targetChamber.coord)
    setHintPath(path)
    if (next) {
      if (next.r < playerPos.r) setHintDirLabel('UP ▲')
      else if (next.r > playerPos.r) setHintDirLabel('DOWN ▼')
      else if (next.c < playerPos.c) setHintDirLabel('LEFT ◀')
      else if (next.c > playerPos.c) setHintDirLabel('RIGHT ▶')
    }
    playStar()
  }, [roundData.chambers, mazeConfig.grid, playerPos, playStar])

  useEffect(() => {
    if (hintSeq > 0) {
      computeAndShowHint()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintSeq])

  const advanceRound = () => {
    if (completedRef.current) return
    if (roundIdx < TOTAL_MAZE_ROUNDS - 1) {
      setRoundIdx(r => r + 1)
      setStatusMsg(null)
    } else {
      completedRef.current = true
      onComplete({
        correct: correctRef.current,
        total: Math.max(totalRef.current, TOTAL_MAZE_ROUNDS),
      })
    }
  }

  // Telemetry update
  useEffect(() => {
    onTelemetry({
      wave: roundIdx + 1,
      totalWaves: TOTAL_MAZE_ROUNDS,
      timeLeft: Math.ceil(timeLeft),
      lives: hearts,
    })
  }, [roundIdx, Math.ceil(timeLeft), hearts])

  // Level countdown timer
  useEffect(() => {
    if (isPaused || completedRef.current) return
    const iv = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (!completedRef.current) {
            completedRef.current = true
            onComplete({
              correct: correctRef.current,
              total: Math.max(totalRef.current, TOTAL_MAZE_ROUNDS),
            })
          }
          return 0
        }
        return prev - 1
      })
      setShieldTicks(s => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(iv)
  }, [isPaused])

  // Patrolling cosmic alien chasers
  useEffect(() => {
    if (isPaused || completedRef.current) return
    const speed = mazeConfig.patrols[0]?.speedMs || 520
    const iv = setInterval(() => {
      const nextPositions = mazeConfig.patrols.map((p, idx) => {
        const nextStep = (patrolIdxRef.current[idx] + 1) % p.path.length
        patrolIdxRef.current[idx] = nextStep
        return p.path[nextStep]
      })
      setPatrolPositions(nextPositions)
    }, speed)
    return () => clearInterval(iv)
  }, [isPaused, mazeConfig])

  // Check collision between player and patrol chasers
  useEffect(() => {
    if (isPaused || completedRef.current || shieldTicks > 0 || roundLockRef.current) return
    const hitChaser = patrolPositions.some(p => p.r === playerPos.r && p.c === playerPos.c)
    if (hitChaser) {
      playBoing()
      playWrong()
      setShieldTicks(2)
      setPlayerPos(mazeConfig.playerStart)
      setHearts(h => {
        const nextH = h - 1
        if (nextH <= 0 && !completedRef.current) {
          completedRef.current = true
          setTimeout(() => {
            onComplete({
              correct: correctRef.current,
              total: Math.max(totalRef.current, 1),
            })
          }, 500)
        }
        return nextH
      })
      setStatusMsg({ text: 'Aliens tagged you! Watch out & keep moving! 👾', good: false })
    }
  }, [patrolPositions, playerPos, isPaused, shieldTicks, mazeConfig.playerStart])

  // Helper: check if cell is walkable
  const canMove = useCallback(
    (r: number, c: number) => {
      return (
        r >= 0 &&
        r < mazeConfig.rows &&
        c >= 0 &&
        c < mazeConfig.cols &&
        mazeConfig.grid[r][c] === 0
      )
    },
    [mazeConfig]
  )

  // Move Explorer via Arrow Buttons or Keyboard
  const movePlayer = useCallback(
    (dr: number, dc: number) => {
      if (isPaused || completedRef.current || roundLockRef.current) return
      const nr = playerPos.r + dr
      const nc = playerPos.c + dc
      if (!canMove(nr, nc)) return

      playClick()
      const nextCoord = { r: nr, c: nc }
      setPlayerPos(nextCoord)

      // Update active hint path if showing
      if (hintPath.length > 0) {
        const targetChamber = roundData.chambers.find(ch => ch.isTarget)
        if (targetChamber) {
          const { next, path } = findMazeNextStep(mazeConfig.grid, nextCoord, targetChamber.coord)
          setHintPath(path)
          if (next) {
            if (next.r < nextCoord.r) setHintDirLabel('UP ▲')
            else if (next.r > nextCoord.r) setHintDirLabel('DOWN ▼')
            else if (next.c < nextCoord.c) setHintDirLabel('LEFT ◀')
            else if (next.c > nextCoord.c) setHintDirLabel('RIGHT ▶')
          }
        }
      }

      // Check if player reached a chamber
      const reachedChamber = roundData.chambers.find(
        ch => ch.coord.r === nr && ch.coord.c === nc
      )
      if (reachedChamber) {
        totalRef.current += 1
        if (reachedChamber.isTarget) {
          roundLockRef.current = true
          correctRef.current += 1
          setCheckCount(c => c + 1)
          playCoin()
          playCorrect()
          speak(reachedChamber.char)
          onAnswer(true, 25)
          setStatusMsg({
            text: `Awesome! You reached ${reachedChamber.label} (${reachedChamber.char})! 🎉`,
            good: true,
          })
          setTimeout(() => {
            advanceRound()
          }, 700)
        } else {
          playWrong()
          onAnswer(false, 0)
          setStatusMsg({
            text: `That's "${reachedChamber.char}" (${reachedChamber.label}). Find ${roundData.targetChar}!`,
            good: false,
          })
        }
      }
    },
    [isPaused, playerPos, canMove, playClick, hintPath.length, roundData, mazeConfig.grid]
  )

  // Keyboard Arrow keys + WASD support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || completedRef.current) return
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        movePlayer(-1, 0)
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        movePlayer(1, 0)
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        movePlayer(0, -1)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        movePlayer(0, 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [movePlayer, isPaused])

  const nextHintCoord = hintPath.length > 1 ? hintPath[1] : null

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-500/70 bg-[#18163A] text-white select-none">
      {/* Top Cosmic HUD (Matching Screenshot: Timer Top-Left, Hearts + Checkmark Score Top-Right) */}
      <div className="px-4 py-3 bg-[#100E2A] border-b border-indigo-500/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'px-3 py-1 rounded-xl font-mono text-base sm:text-lg font-black flex items-center gap-1.5 border',
              timeLeft <= 10
                ? 'bg-rose-600/30 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-indigo-900/60 text-white border-indigo-400/40'
            )}
          >
            <span>⏱️</span>
            <span>{formatDuration(timeLeft)}</span>
          </div>
          <div className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-600/40 border border-purple-400/40 text-purple-200">
            Maze {roundIdx + 1} / {TOTAL_MAZE_ROUNDS} • <span className="uppercase">{resolvedDiff}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 3 Hearts */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(h => (
              <Heart
                key={h}
                className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 transition-all',
                  hearts >= h
                    ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.7)]'
                    : 'text-slate-700 fill-slate-800'
                )}
              />
            ))}
          </div>
          {/* Checkmark Score */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-base">
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{checkCount}</span>
          </div>
        </div>
      </div>

      {/* Cosmic Space Maze Grid */}
      <div
        className="p-3 sm:p-5 flex flex-col items-center justify-center relative"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 45%), radial-gradient(circle at 80% 75%, rgba(56,189,248,0.2), transparent 45%), #1D1142',
        }}
      >
        <div
          className="grid gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-2xl bg-[#34425E]/90 border-2 border-amber-400/70 shadow-[0_0_30px_rgba(99,102,241,0.4)] w-full max-w-2xl"
          style={{
            gridTemplateColumns: `repeat(${mazeConfig.cols}, minmax(0, 1fr))`,
          }}
        >
          {mazeConfig.grid.map((row, r) =>
            row.map((cell, c) => {
              const isWall = cell === 1
              const isPlayer = playerPos.r === r && playerPos.c === c
              const chaserHere = patrolPositions.find(p => p.r === r && p.c === c)
              const chamber = roundData.chambers.find(ch => ch.coord.r === r && ch.coord.c === c)
              const isHintCell = hintPath.some(hp => hp.r === r && hp.c === c)

              // Check adjacent to player for inline Wordwall directional arrow overlays!
              const isUpAdj = playerPos.r - 1 === r && playerPos.c === c && !isWall
              const isDownAdj = playerPos.r + 1 === r && playerPos.c === c && !isWall
              const isLeftAdj = playerPos.r === r && playerPos.c - 1 === c && !isWall
              const isRightAdj = playerPos.r === r && playerPos.c + 1 === c && !isWall

              if (isWall) {
                return (
                  <div
                    key={`${r}_${c}`}
                    className="aspect-square rounded-[4px] bg-gradient-to-br from-[#2B0F54] to-[#4C1D95] border border-amber-400/75 shadow-inner relative overflow-hidden"
                  >
                    <div className="w-1 h-1 rounded-full bg-white/30 absolute top-1 left-1" />
                  </div>
                )
              }

              return (
                <div
                  key={`${r}_${c}`}
                  onClick={() => {
                    if (isUpAdj) movePlayer(-1, 0)
                    else if (isDownAdj) movePlayer(1, 0)
                    else if (isLeftAdj) movePlayer(0, -1)
                    else if (isRightAdj) movePlayer(0, 1)
                  }}
                  className={cn(
                    'aspect-square rounded-[5px] bg-[#3E4C6A] relative flex items-center justify-center transition-colors',
                    (isUpAdj || isDownAdj || isLeftAdj || isRightAdj) && 'cursor-pointer hover:bg-[#4F6185]',
                    isHintCell && 'ring-2 ring-amber-300/70 bg-amber-500/20'
                  )}
                >
                  {/* Golden BFS hint crumb */}
                  {isHintCell && !isPlayer && !chamber && (
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
                  )}

                  {/* Arabic Letter Chamber Card */}
                  {chamber && (
                    <div
                      className={cn(
                        'w-[92%] h-[92%] rounded-md bg-[#FEF3C7] border-2 flex flex-col items-center justify-center shadow-md z-10',
                        hintPath.length > 0 && chamber.isTarget
                          ? 'border-amber-400 ring-2 ring-amber-300 animate-pulse'
                          : 'border-amber-600/80'
                      )}
                    >
                      <span
                        className="font-arabic text-base sm:text-xl md:text-2xl font-black text-slate-900 leading-none"
                        dir="rtl"
                      >
                        {chamber.char}
                      </span>
                    </div>
                  )}

                  {/* Alien Chaser */}
                  {chaserHere && (
                    <motion.div
                      animate={{ y: [0, -2, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="z-20 text-lg sm:text-2xl drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                    >
                      👾
                    </motion.div>
                  )}

                  {/* Player Space Explorer Sprite */}
                  {isPlayer && (
                    <motion.div
                      layoutId="maze-explorer"
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className={cn(
                        'z-30 w-[85%] h-[85%] rounded-full bg-gradient-to-b from-white to-blue-200 border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.85)] flex items-center justify-center text-sm sm:text-lg',
                        shieldTicks > 0 && 'animate-ping opacity-75'
                      )}
                    >
                      🧑‍🚀
                    </motion.div>
                  )}

                  {/* Inline Surrounding Arrow Buttons (Matching Screenshot!) */}
                  {isUpAdj && !chamber && (
                    <span
                      className={cn(
                        'z-20 text-xs sm:text-sm font-black drop-shadow pointer-events-none',
                        nextHintCoord?.r === r && nextHintCoord?.c === c
                          ? 'text-amber-300 scale-125 animate-bounce'
                          : 'text-white/80'
                      )}
                    >
                      ▲
                    </span>
                  )}
                  {isDownAdj && !chamber && (
                    <span
                      className={cn(
                        'z-20 text-xs sm:text-sm font-black drop-shadow pointer-events-none',
                        nextHintCoord?.r === r && nextHintCoord?.c === c
                          ? 'text-amber-300 scale-125 animate-bounce'
                          : 'text-white/80'
                      )}
                    >
                      ▼
                    </span>
                  )}
                  {isLeftAdj && !chamber && (
                    <span
                      className={cn(
                        'z-20 text-xs sm:text-sm font-black drop-shadow pointer-events-none',
                        nextHintCoord?.r === r && nextHintCoord?.c === c
                          ? 'text-amber-300 scale-125 animate-bounce'
                          : 'text-white/80'
                      )}
                    >
                      ◀
                    </span>
                  )}
                  {isRightAdj && !chamber && (
                    <span
                      className={cn(
                        'z-20 text-xs sm:text-sm font-black drop-shadow pointer-events-none',
                        nextHintCoord?.r === r && nextHintCoord?.c === c
                          ? 'text-amber-300 scale-125 animate-bounce'
                          : 'text-white/80'
                      )}
                    >
                      ▶
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Status / Hint Pill */}
        {(statusMsg || hintDirLabel) && (
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {hintDirLabel && (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow animate-pulse">
                💡 Golden Path: Move {hintDirLabel}
              </span>
            )}
            {statusMsg && (
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-black shadow',
                  statusMsg.good
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                )}
              >
                {statusMsg.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Dark Prompt Bar + Dedicated Touch Arrow D-Pad */}
      <div className="p-3 sm:p-4 bg-[#100E2A] border-t border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Prompt Card (Matches Screenshot Bottom Bar "Find the letter...") */}
        <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] border-2 border-amber-400 text-slate-950 font-arabic text-3xl font-black flex items-center justify-center shrink-0" dir="rtl">
            {roundData.targetChar}
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold text-indigo-300">
              {letterObj.name_english} Maze Target
            </div>
            <div className="text-sm sm:text-base font-black text-white">
              Find the letter <span className="text-amber-300">{roundData.targetLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => speak(roundData.targetChar)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
            title="Hear letter"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={computeAndShowHint}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 shrink-0"
            title="Show path hint"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>

        {/* Dedicated Tactile Arrow Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-bold text-indigo-300 hidden sm:block">
            Tap Arrows or Keys:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <div />
            <button
              type="button"
              onClick={() => movePlayer(-1, 0)}
              disabled={!canMove(playerPos.r - 1, playerPos.c)}
              aria-label="Move Up"
              className={cn(
                'w-12 h-11 rounded-xl flex items-center justify-center font-black border-2 transition-all active:scale-90',
                nextHintCoord?.r === playerPos.r - 1 && nextHintCoord?.c === playerPos.c
                  ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300'
                  : canMove(playerPos.r - 1, playerPos.c)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed'
              )}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />

            <button
              type="button"
              onClick={() => movePlayer(0, -1)}
              disabled={!canMove(playerPos.r, playerPos.c - 1)}
              aria-label="Move Left"
              className={cn(
                'w-12 h-11 rounded-xl flex items-center justify-center font-black border-2 transition-all active:scale-90',
                nextHintCoord?.r === playerPos.r && nextHintCoord?.c === playerPos.c - 1
                  ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300'
                  : canMove(playerPos.r, playerPos.c - 1)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed'
              )}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => movePlayer(1, 0)}
              disabled={!canMove(playerPos.r + 1, playerPos.c)}
              aria-label="Move Down"
              className={cn(
                'w-12 h-11 rounded-xl flex items-center justify-center font-black border-2 transition-all active:scale-90',
                nextHintCoord?.r === playerPos.r + 1 && nextHintCoord?.c === playerPos.c
                  ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300'
                  : canMove(playerPos.r + 1, playerPos.c)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed'
              )}
            >
              <ArrowDown className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => movePlayer(0, 1)}
              disabled={!canMove(playerPos.r, playerPos.c + 1)}
              aria-label="Move Right"
              className={cn(
                'w-12 h-11 rounded-xl flex items-center justify-center font-black border-2 transition-all active:scale-90',
                nextHintCoord?.r === playerPos.r && nextHintCoord?.c === playerPos.c + 1
                  ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300'
                  : canMove(playerPos.r, playerPos.c + 1)
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/60 text-slate-600 border-slate-700 cursor-not-allowed'
              )}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
