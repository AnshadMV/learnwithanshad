import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Tv, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Volume2, 
  Radio, 
  MousePointer, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  Play
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSound } from '@/hooks/useSound'
import Button from '@/components/ui/Button'
import ArabicText from '@/components/arabic/ArabicText'

interface TeacherLiveScreenWatcherProps {
  student: {
    student_id: string
    display_name: string
    current_game: string | null
    current_letter?: string | null
    score: number
    accuracy: number
    status: string
  }
  onClose: () => void
}

interface CursorEvent {
  xPct: number
  yPct: number
  isClick: boolean
  timestamp: number
}

interface ViewportState {
  pathname: string
  search: string
  gameSlug: string
  letterId: string
  score: number
  accuracy: number
  status: string
  lastUpdated: string
}

export default function TeacherLiveScreenWatcher({ student, onClose }: TeacherLiveScreenWatcherProps) {
  const { playCorrect, playStar, playCoin } = useSound()

  const [hasVideoStream, setHasVideoStream] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState<CursorEvent>({ xPct: 50, yPct: 50, isClick: false, timestamp: Date.now() })
  const [recentClicks, setRecentClicks] = useState<Array<{ id: number; x: number; y: number }>>([])
  
  const [viewportState, setViewportState] = useState<ViewportState>({
    pathname: student.current_game ? '/games/' + student.current_game : '/alphabet',
    search: '?letter=' + (student.current_letter || 'alef'),
    gameSlug: student.current_game && student.current_game !== 'idle' ? student.current_game : 'letter-safari',
    letterId: student.current_letter && student.current_letter !== '—' ? student.current_letter : 'ta',
    score: student.score || 0,
    accuracy: student.accuracy || 100,
    status: student.status || 'playing',
    lastUpdated: 'Just now',
  })

  const [activityFeed, setActivityFeed] = useState<string[]>([
    `Observing ${student.display_name}'s live screen`,
    `Connected to live interaction feed`,
  ])
  const [sentReaction, setSentReaction] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // ---------------------------------------------------------------------------
  // WebRTC & Supabase Channel Setup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const channelName = `student_screen_${student.student_id}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    channelRef.current = channel

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    })

    peerConnectionRef.current = pc

    const isRemoteDescSetRef = { current: false }
    const iceQueue: RTCIceCandidateInit[] = []

    pc.ontrack = event => {
      if (videoRef.current && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0]
        videoRef.current.muted = true
        videoRef.current.play().catch(() => {})
        setHasVideoStream(true)
        setActivityFeed(prev => [`📹 Direct WebRTC Video Stream Active!`, ...prev.slice(0, 8)])
      }
    }

    pc.onicecandidate = event => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            type: 'candidate',
            candidate: event.candidate,
          },
        }).catch(() => {})
      }
    }

    // Listen to signals from student
    channel
      .on('broadcast', { event: 'screen_status' }, ({ payload }) => {
        if (payload?.active === false) {
          setHasVideoStream(false)
          setLiveSnapshot(null)
          if (videoRef.current) videoRef.current.srcObject = null
          setActivityFeed(prev => [`Student screen stream paused.`, ...prev.slice(0, 8)])
        }
      })
      .on('broadcast', { event: 'screen_frame' }, ({ payload }) => {
        if (payload?.image) {
          setLiveSnapshot(payload.image)
        }
      })
      .on('broadcast', { event: 'student_viewport' }, ({ payload }) => {
        if (!payload) return
        setViewportState(prev => ({
          ...prev,
          pathname: payload.pathname || prev.pathname,
          search: payload.search || prev.search,
          gameSlug: payload.gameSlug || payload.game_slug || prev.gameSlug,
          letterId: payload.letterId || payload.letter_id || prev.letterId,
          score: payload.score !== undefined ? payload.score : prev.score,
          accuracy: payload.accuracy !== undefined ? payload.accuracy : prev.accuracy,
          status: payload.status || prev.status,
          lastUpdated: new Date().toLocaleTimeString(),
        }))
        const gameDisplay = (payload.gameSlug || payload.game_slug || 'Letter Game').replace(/-/g, ' ')
        setActivityFeed(prev => [`Student active on ${gameDisplay}`, ...prev.slice(0, 8)])
      })
      .on('broadcast', { event: 'student_cursor' }, ({ payload }) => {
        if (!payload) return
        setCursorPos({
          xPct: payload.xPct,
          yPct: payload.yPct,
          isClick: payload.isClick,
          timestamp: payload.timestamp,
        })

        if (payload.isClick) {
          playCoin()
          setRecentClicks(prev => [
            { id: Date.now(), x: payload.xPct, y: payload.yPct },
            ...prev.slice(0, 5),
          ])
          setActivityFeed(prev => [
            `👆 Tapped at position (${Math.round(payload.xPct)}%, ${Math.round(payload.yPct)}%)`,
            ...prev.slice(0, 8),
          ])
        }
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (!payload) return

        if (payload.type === 'offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            isRemoteDescSetRef.current = true

            while (iceQueue.length > 0) {
              const cand = iceQueue.shift()
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
            }

            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            channel.send({
              type: 'broadcast',
              event: 'webrtc_signal',
              payload: {
                type: 'answer',
                sdp: answer,
              },
            }).catch(() => {})
          } catch (err) {
            console.warn('Error handling SDP offer on teacher:', err)
          }
        } else if (payload.type === 'candidate' && payload.candidate) {
          if (!isRemoteDescSetRef.current) {
            iceQueue.push(payload.candidate)
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            } catch (err) {
              console.warn('Error adding ICE candidate on teacher:', err)
            }
          }
        }
      })
      .subscribe(() => {
        // Send handshake request the moment channel connects!
        channel.send({
          type: 'broadcast',
          event: 'teacher_joined',
          payload: { teacher: 'Ustadh Anshad' },
        }).catch(() => {})
      })

    return () => {
      pc.close()
      supabase.removeChannel(channel)
    }
  }, [student.student_id])

  // ---------------------------------------------------------------------------
  // Teacher Actions
  // ---------------------------------------------------------------------------
  const requestScreenShare = () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'request_screen_share',
      payload: { requestedBy: 'Ustadh Anshad' },
    }).catch(() => {})

    setActivityFeed(prev => [`Requested live HD screen stream from ${student.display_name}...`, ...prev.slice(0, 8)])
  }

  const sendReaction = (emoji: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_reaction',
      payload: { reaction: emoji, teacherName: 'Ustadh Anshad' },
    }).catch(() => {})

    setSentReaction(emoji)
    playStar()
    setTimeout(() => setSentReaction(null), 2000)
    setActivityFeed(prev => [`Sent encouragement ${emoji} to ${student.display_name}!`, ...prev.slice(0, 8)])
  }

  const speakEncouragement = () => {
    playCorrect()
    if ('speechSynthesis' in window) {
      const phrase = `أحسنتِ يا ${student.display_name}! ما شاء الله ممتاز!`
      const utterance = new SpeechSynthesisUtterance(phrase)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
    sendReaction('🌟')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const activeLetterFormatted = viewportState.letterId.toUpperCase()

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div
        ref={containerRef}
        className="bg-slate-900 border-2 border-blue-500/40 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col text-white"
        style={{ maxHeight: '96vh' }}
      >
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue flex items-center justify-center text-lg font-black shadow-md">
                {student.display_name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">{student.display_name}'s Screen</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live Mirror
                </span>
                {hasVideoStream ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    60fps HD Video
                  </span>
                ) : liveSnapshot ? (
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                    Live Frame Stream
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                    Realtime Viewport
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Active Game: <strong className="text-white capitalize">{viewportState.gameSlug.replace(/-/g, ' ')}</strong> • Letter: <strong className="text-sunny-300 font-arabic">{viewportState.letterId}</strong> • Score: <strong className="text-emerald-400">{viewportState.score} pts</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Fullscreen view"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Display Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 min-h-0 bg-slate-950">
          {/* Left: Screen Viewport */}
          <div className="lg:col-span-3 p-3 sm:p-4 flex flex-col items-center justify-center relative min-h-[380px] sm:min-h-[480px] bg-slate-900/60 overflow-hidden">
            {hasVideoStream ? (
              // 1. Direct WebRTC Video Feed
              <div className="w-full h-full flex items-center justify-center relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain max-h-[520px]"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Direct WebRTC Screen Stream
                </div>
              </div>
            ) : liveSnapshot ? (
              // 2. High-Fidelity Frame Snapshot Stream
              <div className="w-full h-full flex items-center justify-center relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <img
                  src={liveSnapshot}
                  alt={`${student.display_name}'s live screen`}
                  className="w-full h-full object-contain max-h-[520px] rounded-xl"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-teal-300 border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Live Visual Screen Stream
                </div>

                {/* Laser Cursor Overlay on Snapshot */}
                <motion.div
                  className="absolute pointer-events-none z-30 flex items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                  animate={{
                    left: `${cursorPos.xPct}%`,
                    top: `${cursorPos.yPct}%`,
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/90 border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <MousePointer className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white shadow whitespace-nowrap">
                    {student.display_name}
                  </span>
                </motion.div>
              </div>
            ) : (
              // 3. Interactive Mirrored Viewport with Live Cursor & Click Ripples
              <div className="w-full h-full max-w-3xl aspect-[16/10] bg-gradient-to-b from-[#EAF5FF] via-blue-50 to-indigo-100 rounded-2xl border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between text-slate-800 select-none">
                {/* Mirrored Header Bar */}
                <div className="bg-white/95 backdrop-blur-md px-4 py-2 border-b border-blue-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-brand-blue font-mono">{viewportState.pathname}</span>
                  </div>
                  <div className="font-bold text-gray-500 text-[11px] flex items-center gap-2">
                    <span>{student.display_name}'s Device</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 font-bold text-brand-blue">
                      SCORE: {viewportState.score}
                    </span>
                  </div>
                </div>

                {/* Mirrored Activity Screen (Matches Student Game Interface!) */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-gray-400">
                    FIND THIS LETTER:
                  </div>

                  <div className="w-24 h-24 rounded-3xl bg-blue-600 shadow-xl border-4 border-white flex items-center justify-center text-5xl font-arabic font-black text-white animate-bounce-gentle">
                    {viewportState.letterId || 'ت'}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-800 font-display capitalize">
                      {viewportState.gameSlug.replace(/-/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Student is actively playing on their device
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-w-md w-full pt-2">
                    {['د', 'س', 'ت', 'ل'].map((ch, idx) => (
                      <div
                        key={idx}
                        className="py-3 px-2 rounded-2xl bg-white border-2 border-blue-100 shadow-sm font-arabic font-bold text-xl text-brand-blue"
                      >
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Laser / Touch Pointer Tracker */}
                <motion.div
                  className="absolute pointer-events-none z-30 flex items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                  animate={{
                    left: `${cursorPos.xPct}%`,
                    top: `${cursorPos.yPct}%`,
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/85 border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <MousePointer className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white shadow whitespace-nowrap">
                    {student.display_name}
                  </span>
                </motion.div>

                {/* Click / Tap Ripples */}
                {recentClicks.map(c => (
                  <motion.div
                    key={c.id}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3.5, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute pointer-events-none w-10 h-10 rounded-full border-4 border-sunny-400 bg-sunny-300/30 -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  />
                ))}

                {/* Mirrored Footer */}
                <div className="bg-white/90 px-4 py-1.5 border-t border-blue-200 text-[10px] text-gray-400 flex items-center justify-between font-mono">
                  <span>Pointer: ({Math.round(cursorPos.xPct)}%, {Math.round(cursorPos.yPct)}%)</span>
                  <span>Sync: Live Interaction Broadcast Active</span>
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="w-full mt-3 flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={requestScreenShare}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Tv className="w-3.5 h-3.5 text-blue-400" />
                  <span>Request 1080p Screen Stream</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={speakEncouragement}
                  className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 border-0 shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Cheer in Arabic</span>
                </Button>
              </div>

              {sentReaction && (
                <span className="text-xs font-bold text-sunny-400 animate-pulse">
                  Cheer {sentReaction} sent to student!
                </span>
              )}
            </div>
          </div>

          {/* Right Sidebar: Live Activity Feed & Quick Stickers */}
          <div className="p-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Live Student Activity</span>
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activityFeed.map((msg, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] leading-tight text-slate-300"
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Send Instant Encouragement
                </h4>
                <div className="grid grid-cols-5 gap-1.5">
                  {['⭐', '🎉', '👏', '🏆', '❤️'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-brand-blue text-xl hover:scale-110 active:scale-95 transition-all text-center"
                      title={`Send ${emoji} to ${student.display_name}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <span className="font-bold text-slate-400 block text-[10px] uppercase">
                Active Session Summary
              </span>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Current Game:</span>
                <span className="font-bold text-brand-blue capitalize">{viewportState.gameSlug.replace(/-/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Current Score:</span>
                <span className="font-bold text-emerald-400">{viewportState.score} pts</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Engagement:</span>
                <span className="font-bold text-emerald-400">Active Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
