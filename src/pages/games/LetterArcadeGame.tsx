import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Map,
  PauseCircle,
  Shield,
  Sliders,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { ARABIC_LETTERS, getLetterById } from '@/data/arabicLetters'
import {
  getArcadeLevelDef,
  type ArcadeDifficulty,
  type ArcadeLetterMode,
} from '@/data/arcadeLevels'
import { useAuth } from '@/hooks/useAuth'
import { useGameSession } from '@/hooks/useGameSession'
import { useArcadeProgress } from '@/hooks/useArcadeProgress'
import {
  broadcastArcadeTelemetry,
  getSavedRoomDirective,
  getSavedStudentDirective,
  useStudentArcadeRemoteControl,
  type ArcadeTeacherDirective,
} from '@/hooks/useArcadeTeacherControl'
import { useSound } from '@/hooks/useSound'
import ArcadeLevelMap from '@/components/arcade/ArcadeLevelMap'
import TeacherArcadeControlPanel from '@/components/arcade/TeacherArcadeControlPanel'
import Level1MoleWhack from '@/components/arcade/Level1MoleWhack'
import Level2MazeChase from '@/components/arcade/Level2MazeChase'
import Level3BalloonBlitz from '@/components/arcade/Level3BalloonBlitz'
import Level4ArrowFlight from '@/components/arcade/Level4ArrowFlight'
import Level5MemoryBlitz from '@/components/arcade/Level5MemoryBlitz'
import Level6ConveyorSorter from '@/components/arcade/Level6ConveyorSorter'
import Level7QuizShow from '@/components/arcade/Level7QuizShow'
import Level8ArrowCatcher from '@/components/arcade/Level8ArrowCatcher'
import Level9WordHunter from '@/components/arcade/Level9WordHunter'
import Level10BossGauntlet from '@/components/arcade/Level10BossGauntlet'
import GameComplete from '@/components/game/GameComplete'
import Button from '@/components/ui/Button'
import type { GameResult } from '@/types'
import { cn } from '@/lib/utils'

interface LetterArcadeGameProps {
  defaultLevel?: number
  customSlug?: string
}

export default function LetterArcadeGame({
  defaultLevel,
  customSlug,
}: LetterArcadeGameProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile, isTeacher } = useAuth()
  const { playStar, playClick } = useSound()

  const roomCode = (
    searchParams.get('room') ||
    (typeof window !== 'undefined' ? localStorage.getItem('arabic_student_room') : '') ||
    'LEVEL-1'
  ).toUpperCase()

  const studentId =
    user?.id ||
    profile?.id ||
    (typeof window !== 'undefined' ? localStorage.getItem('arabic_device_student_id') : null) ||
    'guest_student'
  const studentName =
    profile?.display_name ||
    (typeof window !== 'undefined' ? localStorage.getItem('arabic_student_name') : null) ||
    'Student Explorer'

  const paramLetter = searchParams.get('letter') || 'alef'
  const validLetter = getLetterById(paramLetter) ? paramLetter : ARABIC_LETTERS[0].id
  const paramLevelRaw = Number(searchParams.get('level'))
  const initialLevel =
    defaultLevel || (paramLevelRaw >= 1 && paramLevelRaw <= 10 ? paramLevelRaw : 0)

  const [letterId, setLetterId] = useState<string>(validLetter)
  const [activeLevel, setActiveLevel] = useState<number>(initialLevel) // 0 = 10-Level Map, 1..10 = playing level
  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>(() => {
    const d = searchParams.get('difficulty')
    return d === 'simple' || d === 'medium' || d === 'hard' || d === 'adaptive' ? d : 'adaptive'
  })
  const [letterMode, setLetterMode] = useState<ArcadeLetterMode>(() => {
    const m = searchParams.get('mode')
    return m === 'more-letters' || m === 'letter-types' || m === 'mixed' ? m : 'mixed'
  })
  const [waveSeconds, setWaveSeconds] = useState<number>(() => {
    const s = Number(searchParams.get('seconds'))
    return s >= 5 && s <= 30 ? s : 10
  })

  // Teacher lock & control state
  const [isPaused, setIsPaused] = useState(false)
  const [lockToLevel, setLockToLevel] = useState<number | null>(null)
  const [strictSequential, setStrictSequential] = useState(false)
  const [hintSeq, setHintSeq] = useState(0)
  const [restartSeq, setRestartSeq] = useState(0)
  const [nextWaveSeq, setNextWaveSeq] = useState(0)
  const [bonusTimeSeq, setBonusTimeSeq] = useState(0)
  const [bonusTimeSec, setBonusTimeSec] = useState(5)
  const [teacherToast, setTeacherToast] = useState<string | null>(null)
  const [showTeacherDrawer, setShowTeacherDrawer] = useState(false)

  // Live level stats & telemetry
  const [liveWave, setLiveWave] = useState<{
    wave: number
    totalWaves: number
    timeLeft: number
    lives?: number
  }>({ wave: 1, totalWaves: 10, timeLeft: 10 })
  const [completedResult, setCompletedResult] = useState<GameResult | null>(null)

  const letterObj = getLetterById(letterId) || ARABIC_LETTERS[0]
  const levelDef = getArcadeLevelDef(activeLevel || 1)
  const gameSlug = customSlug || (activeLevel > 0 ? `letter-arcade-l${activeLevel}` : 'letter-arcade')

  const {
    getLetterProgress,
    recordLevelCompletion,
    isLevelLocked,
  } = useArcadeProgress()

  const {
    score,
    recordAnswer,
    completeGame,
    startGame,
    resetGame,
  } = useGameSession({
    gameSlug,
    letterId,
  })

  const lastTelemetryRef = useRef<number>(0)

  // Sync URL query params into state when navigated externally
  useEffect(() => {
    const urlLetter = searchParams.get('letter')
    if (urlLetter && getLetterById(urlLetter)) {
      setLetterId(urlLetter)
    }
    const urlLevel = Number(searchParams.get('level'))
    if (urlLevel >= 1 && urlLevel <= 10) {
      setActiveLevel(urlLevel)
    }
  }, [searchParams])

  // Restore any saved teacher room or student directive on mount
  useEffect(() => {
    const studentDir = getSavedStudentDirective(studentId)
    const roomDir = getSavedRoomDirective(roomCode)
    const merged = { ...roomDir, ...studentDir }
    if (merged) {
      if (merged.lockToLevel !== undefined) setLockToLevel(merged.lockToLevel ?? null)
      if (merged.strictSequential !== undefined) setStrictSequential(Boolean(merged.strictSequential))
      if (merged.difficulty) setDifficulty(merged.difficulty)
      if (merged.letterMode) setLetterMode(merged.letterMode)
      if (merged.waveSeconds) setWaveSeconds(merged.waveSeconds)
      if (merged.paused !== undefined) setIsPaused(Boolean(merged.paused))
    }
  }, [roomCode, studentId])

  // Start / reset game session when entering an active level
  useEffect(() => {
    if (activeLevel >= 1 && activeLevel <= 10) {
      setCompletedResult(null)
      startGame()
    } else {
      resetGame()
    }
  }, [activeLevel, letterId, restartSeq])

  const showNotice = useCallback((msg: string) => {
    setTeacherToast(msg)
    setTimeout(() => setTeacherToast(null), 3500)
  }, [])

  // Handle real-time teacher remote control commands
  const handleTeacherDirective = useCallback(
    (cmd: ArcadeTeacherDirective) => {
      if (cmd.letterId && getLetterById(cmd.letterId)) {
        setLetterId(cmd.letterId)
      }
      if (cmd.difficulty) setDifficulty(cmd.difficulty)
      if (cmd.letterMode) setLetterMode(cmd.letterMode)
      if (cmd.waveSeconds) setWaveSeconds(cmd.waveSeconds)
      if (cmd.paused !== undefined) {
        setIsPaused(Boolean(cmd.paused))
        showNotice(cmd.paused ? '⏸️ Paused by Teacher' : '▶️ Resumed by Teacher')
      }
      if (cmd.lockToLevel !== undefined) {
        setLockToLevel(cmd.lockToLevel ?? null)
        if (cmd.lockToLevel) {
          setActiveLevel(cmd.lockToLevel)
          showNotice(`🔒 Teacher locked & opened Level ${cmd.lockToLevel}`)
        } else if (cmd.unlockAll) {
          showNotice('🔓 Teacher unlocked all 10 levels!')
        }
      }
      if (cmd.strictSequential !== undefined) {
        setStrictSequential(Boolean(cmd.strictSequential))
      }
      if (cmd.level && cmd.level >= 1 && cmd.level <= 10) {
        setCompletedResult(null)
        setActiveLevel(cmd.level)
        showNotice(`🎮 Teacher switched to Level ${cmd.level}`)
      }
      if (cmd.hintSeq) {
        setHintSeq(cmd.hintSeq)
        showNotice('💡 Golden Hint from Teacher!')
      }
      if (cmd.bonusTimeSeq) {
        setBonusTimeSec(cmd.bonusTimeSec || 5)
        setBonusTimeSeq(cmd.bonusTimeSeq)
        showNotice(`⏱️ +${cmd.bonusTimeSec || 5}s Bonus Time!`)
      }
      if (cmd.nextWaveSeq) {
        setNextWaveSeq(cmd.nextWaveSeq)
        showNotice('⏭️ Teacher skipped to Next Wave')
      }
      if (cmd.restartSeq) {
        setCompletedResult(null)
        setIsPaused(false)
        setRestartSeq(cmd.restartSeq)
        showNotice('🔄 Level Restarted by Teacher')
      }
    },
    [showNotice]
  )

  useStudentArcadeRemoteControl(handleTeacherDirective, roomCode, studentId)

  // Broadcast live Arcade telemetry cleanly
  const emitTelemetry = useCallback(
    (patch: { wave: number; totalWaves: number; timeLeft: number; lives?: number }) => {
      setLiveWave(patch)
      const now = Date.now()
      if (now - lastTelemetryRef.current < 450) return
      lastTelemetryRef.current = now

      broadcastArcadeTelemetry({
        student_id: studentId,
        display_name: studentName,
        gameSlug,
        letterId,
        level: activeLevel || 1,
        levelTitle: levelDef.title,
        wave: patch.wave,
        totalWaves: patch.totalWaves,
        timeLeft: patch.timeLeft,
        difficulty,
        letterMode,
        score,
        accuracy: 100,
        lives: patch.lives,
        paused: isPaused,
        lockedLevel: lockToLevel,
        strictSequential,
        status: completedResult ? 'completed' : isPaused ? 'paused' : activeLevel > 0 ? 'playing' : 'map',
        updatedAt: new Date().toISOString(),
      })
    },
    [
      studentId,
      studentName,
      gameSlug,
      letterId,
      activeLevel,
      levelDef.title,
      difficulty,
      letterMode,
      score,
      isPaused,
      lockToLevel,
      strictSequential,
      completedResult,
    ]
  )

  // Emit map telemetry periodically when browsing map
  useEffect(() => {
    if (activeLevel === 0) {
      broadcastArcadeTelemetry({
        student_id: studentId,
        display_name: studentName,
        gameSlug: 'letter-arcade',
        letterId,
        level: 1,
        levelTitle: 'Arcade Level Map',
        wave: 0,
        totalWaves: 10,
        timeLeft: waveSeconds,
        difficulty,
        letterMode,
        score: 0,
        accuracy: 100,
        paused: isPaused,
        lockedLevel: lockToLevel,
        strictSequential,
        status: 'map',
        updatedAt: new Date().toISOString(),
      })
    }
  }, [activeLevel, letterId, difficulty, letterMode, waveSeconds, studentId, studentName, isPaused, lockToLevel, strictSequential])

  const handleSelectLevel = (lvl: number) => {
    if (isLevelLocked(letterId, lvl, { strictSequential, lockToLevel })) return
    playClick()
    setCompletedResult(null)
    setActiveLevel(lvl)
    setSearchParams({ letter: letterId, level: String(lvl) })
  }

  const handleChangeLetter = (newLetterId: string) => {
    playClick()
    setLetterId(newLetterId)
    setCompletedResult(null)
    if (activeLevel > 0) {
      setSearchParams({ letter: newLetterId, level: String(activeLevel) })
    } else {
      setSearchParams({ letter: newLetterId })
    }
  }

  const handleLevelComplete = useCallback(async () => {
    const res = await completeGame()
    // Ensure at least 1 star when player finishes all rounds of an arcade level cleanly
    const awardedStars = Math.max(res.stars, res.questionsCorrect > 0 ? 1 : 0)
    const normalized: GameResult = {
      ...res,
      stars: awardedStars,
      passed: awardedStars > 0,
    }
    setCompletedResult(normalized)
    await recordLevelCompletion(
      letterId,
      activeLevel || 1,
      normalized.score,
      normalized.accuracy,
      awardedStars,
      normalized.passed
    )
    playStar()
  }, [completeGame, recordLevelCompletion, letterId, activeLevel, playStar])

  const letterSummary = useMemo(
    () => getLetterProgress(letterId),
    [getLetterProgress, letterId]
  )

  const checkLocked = useCallback(
    (lvl: number) => isLevelLocked(letterId, lvl, { strictSequential, lockToLevel }),
    [isLevelLocked, letterId, strictSequential, lockToLevel]
  )

  const renderActiveLevel = () => {
    const props = {
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
      onAnswer: recordAnswer,
      onTelemetry: emitTelemetry,
      onComplete: handleLevelComplete,
    }

    switch (activeLevel) {
      case 1:
        return <Level1MoleWhack {...props} />
      case 2:
        return <Level2MazeChase {...props} />
      case 3:
        return <Level3BalloonBlitz {...props} />
      case 4:
        return <Level4ArrowFlight {...props} />
      case 5:
        return <Level5MemoryBlitz {...props} />
      case 6:
        return <Level6ConveyorSorter {...props} />
      case 7:
        return <Level7QuizShow {...props} />
      case 8:
        return <Level8ArrowCatcher {...props} />
      case 9:
        return <Level9WordHunter {...props} />
      case 10:
        return <Level10BossGauntlet {...props} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Top Navigation & Teacher Control Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {activeLevel > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActiveLevel(0)
                setCompletedResult(null)
                setSearchParams({ letter: letterId })
              }}
              className="flex items-center gap-1.5"
            >
              <Map className="w-4 h-4" />
              <span>All 10 Levels</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/games')}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Games Library</span>
            </Button>
          )}

          <div className="px-3 py-1 rounded-full bg-white border border-blue-200 shadow-sm flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <span className="font-arabic text-lg text-brand-blue" dir="rtl">
              {letterObj.letter}
            </span>
            <span>{letterObj.name_english}</span>
            {activeLevel > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-amber-700">
                  L{activeLevel}/10: {levelDef.title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Live Game Bar + Teacher Controls Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeLevel > 0 && (
            <>
              {/* Inline Quick Difficulty Switcher */}
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-blue-100 shadow-sm">
                <Sliders className="w-3.5 h-3.5 text-brand-blue" />
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as ArcadeDifficulty)}
                  className="text-xs font-bold bg-transparent text-slate-700 focus:outline-none"
                  title="Difficulty option"
                >
                  <option value="adaptive">Auto (Simple → Hard)</option>
                  <option value="simple">Simple</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-black shadow">
                Score: {score} pts
              </div>

              <button
                type="button"
                onClick={() => setRestartSeq(s => s + 1)}
                className="p-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-600"
                title="Restart Level"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          {isTeacher && (
            <button
              type="button"
              onClick={() => setShowTeacherDrawer(o => !o)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all',
                showTeacherDrawer
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Teacher Arcade Control</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Teacher Classroom Arcade Commander (visible when teacher clicks control) */}
      {isTeacher && showTeacherDrawer && (
        <TeacherArcadeControlPanel
          mode="classroom"
          roomCode={roomCode}
          initialLetterId={letterId}
          initialLevel={activeLevel || 1}
          currentDifficulty={difficulty}
          currentLetterMode={letterMode}
          currentPaused={isPaused}
          onCommandSent={showNotice}
        />
      )}

      {/* Teacher Command Toast */}
      <AnimatePresence>
        {teacherToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{teacherToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: 10-Level Map OR Active Arcade Level */}
      {activeLevel === 0 ? (
        <ArcadeLevelMap
          letterId={letterId}
          onChangeLetter={handleChangeLetter}
          difficulty={difficulty}
          onChangeDifficulty={setDifficulty}
          letterMode={letterMode}
          onChangeLetterMode={setLetterMode}
          waveSeconds={waveSeconds}
          onChangeWaveSeconds={setWaveSeconds}
          summary={letterSummary}
          lockToLevel={lockToLevel}
          strictSequential={strictSequential}
          isLevelLocked={checkLocked}
          onSelectLevel={handleSelectLevel}
        />
      ) : (
        <div className="relative">
          {/* Quick 1–10 Level Stepper Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(lvlNum => {
              const lvl = getArcadeLevelDef(lvlNum)
              const locked = checkLocked(lvlNum)
              const isCurr = activeLevel === lvlNum
              const isDone = Boolean(letterSummary.levels[lvlNum]?.completed)

              return (
                <button
                  key={lvlNum}
                  type="button"
                  disabled={locked}
                  onClick={() => handleSelectLevel(lvlNum)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap border-2 transition-all flex items-center gap-1 shrink-0',
                    isCurr
                      ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-md scale-105'
                      : locked
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-blue-100 hover:border-brand-blue'
                  )}
                >
                  <span>{lvl.icon}</span>
                  <span>L{lvlNum}</span>
                </button>
              )
            })}
          </div>

          {renderActiveLevel()}

          {/* Live Teacher Pause Overlay */}
          {isPaused && (
            <div className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-400 space-y-4">
                <PauseCircle className="w-16 h-16 mx-auto text-amber-500 animate-pulse" />
                <h2 className="text-2xl font-black text-slate-800">
                  Arcade Paused by Teacher
                </h2>
                <p className="text-sm text-slate-500">
                  Take a quick breath and listen to Ustadh Anshad! Your timer and score are safely paused at Wave {liveWave.wave}/{liveWave.totalWaves}.
                </p>
                {isTeacher && (
                  <Button
                    variant="primary"
                    onClick={() => setIsPaused(false)}
                    className="w-full"
                  >
                    Resume Preview ▶️
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Level Complete Modal */}
      {completedResult && (
        <GameComplete
          result={completedResult}
          gameName={`Level ${activeLevel}: ${levelDef.title} (${letterObj.letter})`}
          onPlayAgain={() => {
            setCompletedResult(null)
            setRestartSeq(s => s + 1)
          }}
          onNext={
            activeLevel < 10 && !checkLocked(activeLevel + 1)
              ? () => {
                  const nextLvl = activeLevel + 1
                  setCompletedResult(null)
                  setActiveLevel(nextLvl)
                  setSearchParams({ letter: letterId, level: String(nextLvl) })
                }
              : undefined
          }
          onBackToGames={() => {
            setCompletedResult(null)
            setActiveLevel(0)
            setSearchParams({ letter: letterId })
          }}
        />
      )}
    </div>
  )
}
