import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Tv, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  Radio, 
  MousePointer, 
  RotateCcw,
  Sparkles,
  Camera,
  Layers,
  Smartphone,
  Monitor,
  Gamepad2,
  Lightbulb,
  Send,
  CheckCircle2,
  Hand,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSound } from '@/hooks/useSound'
import { ARABIC_LETTERS } from '@/data/arabicLetters'
import Button from '@/components/ui/Button'

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
  isMobile?: boolean
  isTablet?: boolean
  isDesktop?: boolean
  deviceType?: 'mobile' | 'tablet' | 'desktop'
}

const CONTROL_GAMES = [
  { slug: 'find-different', name: 'Find Different Letter 🕵️' },
  { slug: 'memory-cards', name: 'Memory Cards 🃏' },
  { slug: 'letter-detective', name: 'Letter Detective 🔎' },
  { slug: 'letter-bingo', name: 'Letter Bingo 🎱' },
  { slug: 'letter-safari', name: 'Letter Safari 🦁' },
  { slug: 'letter-picture-match', name: 'Picture Match 🎯' },
  { slug: 'shape-match', name: 'Letter Shape Match 🔷' },
  { slug: 'balloon-pop', name: 'Balloon Pop 🎈' },
  { slug: 'letter-fishing', name: 'Letter Fishing 🎣' },
  { slug: 'complete-word', name: 'Complete the Word 📝' },
  { slug: 'build-letter', name: 'Build the Letter 🧩' },
  { slug: 'trace-letter', name: 'Trace Letter ✏️' },
]

export default function TeacherLiveScreenWatcher({ student, onClose }: TeacherLiveScreenWatcherProps) {
  const { playCorrect, playStar, playCoin, playClick } = useSound()

  const [hasVideoStream, setHasVideoStream] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState<CursorEvent>({ xPct: 50, yPct: 50, isClick: false, timestamp: Date.now() })
  const [recentClicks, setRecentClicks] = useState<Array<{ id: number; x: number; y: number }>>([])
  const [teacherClicks, setTeacherClicks] = useState<Array<{ id: number; x: number; y: number }>>([])

  // Remote Control State
  const [remoteControlActive, setRemoteControlActive] = useState(true)
  const [remoteSoundMuted, setRemoteSoundMuted] = useState(false)
  const [muteAllSound, setMuteAllSound] = useState(false)
  const [hideUsthadCursor, setHideUsthadCursor] = useState(() => {
    try {
      return localStorage.getItem('arabic_hide_usthad_cursor') === 'true'
    } catch {
      return false
    }
  })
  const [remoteGame, setRemoteGame] = useState('find-different')
  const [remoteLetter, setRemoteLetter] = useState(
    student.current_letter && student.current_letter !== '—' ? student.current_letter : 'alef'
  )
  const [remoteFeedbackToast, setRemoteFeedbackToast] = useState<string | null>(null)
  
  const [viewportState, setViewportState] = useState<ViewportState>({
    pathname: student.current_game && student.current_game !== 'idle' ? '/games/' + student.current_game : '/alphabet',
    search: '?letter=' + (student.current_letter && student.current_letter !== '—' ? student.current_letter : 'alef'),
    gameSlug: student.current_game && student.current_game !== 'idle' ? student.current_game : 'Alphabet Learning',
    letterId: student.current_letter && student.current_letter !== '—' ? student.current_letter : '',
    score: student.score || 0,
    accuracy: student.accuracy || 100,
    status: student.status || 'playing',
    lastUpdated: 'Just now',
  })

  const [activityFeed, setActivityFeed] = useState<string[]>([
    `Observing ${student.display_name}'s live screen`,
    `Remote Control Assist Ready: Tap student screen to interact!`,
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
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
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
          if (videoRef.current) videoRef.current.srcObject = null
          setActivityFeed(prev => [`Student ended direct screen stream. Switching to auto mirror...`, ...prev.slice(0, 8)])
        }
      })
      .on('broadcast', { event: 'screen_frame' }, ({ payload }) => {
        if (payload?.image) {
          setLiveSnapshot(payload.image)
          if (payload.deviceType) {
            setViewportState(prev => ({
              ...prev,
              deviceType: payload.deviceType,
              isTablet: payload.deviceType === 'tablet',
              isMobile: payload.deviceType === 'mobile',
              isDesktop: payload.deviceType === 'desktop',
            }))
          }
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
          isMobile: payload.isMobile !== undefined ? payload.isMobile : prev.isMobile,
          isTablet: payload.isTablet !== undefined ? payload.isTablet : prev.isTablet,
          isDesktop: payload.isDesktop !== undefined ? payload.isDesktop : prev.isDesktop,
          deviceType: payload.deviceType || (payload.isTablet ? 'tablet' : payload.isMobile ? 'mobile' : prev.deviceType || 'desktop'),
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
          if (!muteAllSound) {
            playCoin()
          }
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
  }, [student.student_id, playCoin])

  // ---------------------------------------------------------------------------
  // Teacher Remote Click on Student Screen
  // ---------------------------------------------------------------------------
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!remoteControlActive) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    let xPct = 50
    let yPct = 50

    // Measure media element inside container if present (taking object-contain scaling into account)
    const mediaEl = container.querySelector('video, img') as HTMLVideoElement | HTMLImageElement | null
    if (mediaEl) {
      const naturalWidth = (mediaEl as HTMLVideoElement).videoWidth || (mediaEl as HTMLImageElement).naturalWidth || rect.width
      const naturalHeight = (mediaEl as HTMLVideoElement).videoHeight || (mediaEl as HTMLImageElement).naturalHeight || rect.height

      if (naturalWidth > 0 && naturalHeight > 0) {
        const mediaAspect = naturalWidth / naturalHeight
        const containerAspect = rect.width / rect.height
        let renderW = rect.width
        let renderH = rect.height
        let offX = 0
        let offY = 0

        if (containerAspect > mediaAspect) {
          renderW = rect.height * mediaAspect
          renderH = rect.height
          offX = (rect.width - renderW) / 2
        } else {
          renderW = rect.width
          renderH = rect.width / mediaAspect
          offY = (rect.height - renderH) / 2
        }

        const relX = clickX - offX
        const relY = clickY - offY

        if (relX < 0 || relX > renderW || relY < 0 || relY > renderH) {
          return // Outside actual screen area
        }

        xPct = Math.round((relX / renderW) * 1000) / 10
        yPct = Math.round((relY / renderH) * 1000) / 10
      } else {
        xPct = Math.round((clickX / rect.width) * 1000) / 10
        yPct = Math.round((clickY / rect.height) * 1000) / 10
      }
    } else {
      xPct = Math.round((clickX / rect.width) * 1000) / 10
      yPct = Math.round((clickY / rect.height) * 1000) / 10
    }

    // Broadcast Remote Click to Student Device
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_remote_control',
      payload: {
        type: 'click',
        xPct,
        yPct,
        muted: remoteSoundMuted || muteAllSound,
        hideCursor: hideUsthadCursor,
        teacherName: 'Ustadh Anshad',
        timestamp: Date.now(),
      },
    }).catch(() => {})

    if (!remoteSoundMuted && !muteAllSound) {
      playClick()
    }
    setTeacherClicks(prev => [{ id: Date.now(), x: xPct, y: yPct }, ...prev.slice(0, 5)])
    setActivityFeed(prev => [
      `🎮 Remote Click at (${Math.round(xPct)}%, ${Math.round(yPct)}%) to ${student.display_name}${hideUsthadCursor ? ' (cursor hidden on phone 🙈)' : ''}`,
      ...prev.slice(0, 8),
    ])

    // Request fresh snapshot after short delay
    setTimeout(requestSnapshot, 450)
  }

  // ---------------------------------------------------------------------------
  // Teacher Remote Scroll on Student Screen
  // ---------------------------------------------------------------------------
  const handleRemoteScroll = (deltaY: number) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_remote_control',
      payload: {
        type: 'scroll',
        deltaY,
        teacherName: 'Ustadh Anshad',
        timestamp: Date.now(),
      },
    }).catch(() => {})

    const directionLabel = deltaY === -99999 ? 'to top' : deltaY > 0 ? 'down' : 'up'
    setActivityFeed(prev => [
      `📜 Remotely scrolled student screen ${directionLabel}`,
      ...prev.slice(0, 8),
    ])
    setTimeout(requestSnapshot, 400)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!remoteControlActive) return
    e.preventDefault()
    handleRemoteScroll(e.deltaY)
  }

  // ---------------------------------------------------------------------------
  // Teacher Remote Launch & Controls
  // ---------------------------------------------------------------------------
  const handleRemoteLaunch = () => {
    const targetUrl = `/games/${remoteGame}?letter=${remoteLetter}`
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_remote_control',
      payload: {
        type: 'navigate',
        url: targetUrl,
        teacherName: 'Ustadh Anshad',
        timestamp: Date.now(),
      },
    }).catch(() => {})

    playStar()
    const gameName = CONTROL_GAMES.find(g => g.slug === remoteGame)?.name || remoteGame
    setRemoteFeedbackToast(`Launched ${gameName} for ${student.display_name}! 🚀`)
    setActivityFeed(prev => [
      `🚀 Remotely navigated ${student.display_name} to ${gameName} (${remoteLetter})`,
      ...prev.slice(0, 8),
    ])
    setTimeout(() => setRemoteFeedbackToast(null), 3000)
    setTimeout(requestSnapshot, 600)
  }

  const handleRemoteHint = () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_remote_control',
      payload: {
        type: 'hint',
        teacherName: 'Ustadh Anshad',
        timestamp: Date.now(),
      },
    }).catch(() => {})

    playStar()
    setRemoteFeedbackToast(`Sent hint to ${student.display_name}! 💡`)
    setActivityFeed(prev => [`💡 Sent golden hint to ${student.display_name}!`, ...prev.slice(0, 8)])
    setTimeout(() => setRemoteFeedbackToast(null), 2500)
  }

  const requestScreenShare = () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'request_screen_share',
      payload: { requestedBy: 'Ustadh Anshad' },
    }).catch(() => {})
    setActivityFeed(prev => [`Requested live HD screen stream from ${student.display_name}...`, ...prev.slice(0, 8)])
  }

  const requestSnapshot = () => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'request_snapshot',
      payload: { requestedBy: 'Ustadh Anshad' },
    }).catch(() => {})
    setActivityFeed(prev => [`Requested instant screen snapshot from ${student.display_name}...`, ...prev.slice(0, 8)])
  }

  const toggleHideUsthadCursor = () => {
    setHideUsthadCursor(prev => {
      const next = !prev
      try {
        localStorage.setItem('arabic_hide_usthad_cursor', String(next))
      } catch {}
      setActivityFeed(f => [
        next ? `🙈 Usthad cursor is now HIDDEN on student phone` : `👁️ Usthad cursor is now VISIBLE on student phone`,
        ...f.slice(0, 8),
      ])
      return next
    })
  }

  const toggleMuteAllSound = () => {
    setMuteAllSound(prev => {
      const next = !prev
      // Broadcast to student device to sync mute state
      channelRef.current?.send({
        type: 'broadcast',
        event: 'teacher_remote_control',
        payload: {
          type: 'set_sound',
          muted: next,
          teacherName: 'Ustadh Anshad',
          timestamp: Date.now(),
        },
      }).catch(() => {})

      setActivityFeed(f => [
        next ? `🔇 Muted all sounds (both watcher & student phone)` : `🔊 Unmuted all sounds (both watcher & student phone)`,
        ...f.slice(0, 8),
      ])
      return next
    })
  }

  const sendReaction = (emoji: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'teacher_reaction',
      payload: { reaction: emoji, teacherName: 'Ustadh Anshad' },
    }).catch(() => {})

    setSentReaction(emoji)
    if (!muteAllSound) {
      playStar()
    }
    setTimeout(() => setSentReaction(null), 2000)
    setActivityFeed(prev => [`Sent encouragement ${emoji} to ${student.display_name}!`, ...prev.slice(0, 8)])
  }

  const speakEncouragement = () => {
    if (!muteAllSound) {
      playCorrect()
      if ('speechSynthesis' in window) {
        const phrase = `أحسنتِ يا ${student.display_name}! ما شاء الله ممتاز!`
        const utterance = new SpeechSynthesisUtterance(phrase)
        utterance.lang = 'ar-SA'
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div
        ref={containerRef}
        className="bg-slate-900 border-2 border-blue-500/40 rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col text-white"
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">{student.display_name}'s Screen</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Live Mirror
                </span>

                {/* Remote Control Badge */}
                <button
                  onClick={() => setRemoteControlActive(!remoteControlActive)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                    remoteControlActive
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-2 ring-amber-400/30 shadow'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Click to toggle remote assist"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Remote Assist: {remoteControlActive ? 'ON' : 'OFF'}</span>
                </button>

                {/* Usthad Cursor Indicator Badge */}
                <button
                  onClick={toggleHideUsthadCursor}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                    hideUsthadCursor
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                  title="Click to toggle Usthad cursor visibility on student phone"
                >
                  {hideUsthadCursor ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-blue-400" />}
                  <span>Usthad Cursor: {hideUsthadCursor ? 'Hidden 🙈' : 'Shown 👁️'}</span>
                </button>

                {/* Sound Mute Badge */}
                <button
                  onClick={toggleMuteAllSound}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                    muteAllSound
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                  title="Click to toggle mute all sounds"
                >
                  {muteAllSound ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>Sound: {muteAllSound ? 'All Muted 🔇' : 'ON 🔊'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active: <strong className="text-white capitalize">{viewportState.gameSlug.replace(/-/g, ' ')}</strong>
                {viewportState.letterId && (
                  <> • Letter: <strong className="text-sunny-300 font-arabic">{viewportState.letterId}</strong></>
                )}
                {' '}• Score: <strong className="text-emerald-400">{viewportState.score} pts</strong>
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
          <div className="lg:col-span-3 p-3 sm:p-4 flex flex-col items-center justify-between relative min-h-[420px] bg-slate-900/60 overflow-hidden space-y-3">
            {/* Interactive Phone/Device Viewport Stage */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative p-1 select-none">
              {/* Device Frame */}
              <div
                className={`relative rounded-[36px] p-2 sm:p-2.5 bg-slate-900 border-4 shadow-2xl transition-all flex flex-col items-center justify-center ${
                  remoteControlActive
                    ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                    : 'border-slate-800'
                } ${
                  viewportState.deviceType === 'desktop'
                    ? 'w-full max-w-2xl aspect-[16/10]'
                    : viewportState.deviceType === 'tablet'
                    ? 'w-full max-w-md aspect-[4/3]'
                    : 'w-[280px] sm:w-[310px] aspect-[9/18.5]'
                }`}
                style={{ maxHeight: '490px' }}
              >
                {/* Device Speaker / Notch */}
                {viewportState.deviceType !== 'desktop' && (
                  <div className="w-20 h-3 bg-slate-950 rounded-full mb-1.5 flex items-center justify-center gap-1.5 shrink-0 shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    <div className="w-7 h-1 rounded-full bg-slate-800" />
                  </div>
                )}

                {/* Inner Screen Display (Where student screen is rendered) */}
                <div
                  onClick={handleScreenClick}
                  onWheel={handleWheel}
                  className={`relative w-full flex-1 rounded-[24px] overflow-hidden bg-black flex items-center justify-center ${
                    remoteControlActive ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  {hasVideoStream ? (
                    // 1. Direct WebRTC Video Feed
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : liveSnapshot ? (
                    // 2. High-Fidelity Snapshot Image
                    <img
                      src={liveSnapshot}
                      alt={`${student.display_name}'s live screen`}
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  ) : (
                    // 3. Sync Notice Viewport
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center text-3xl">
                        📱
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">Connecting to {student.display_name}</h3>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                          Student live snapshots and stream frames are syncing...
                        </p>
                      </div>
                      <Button size="sm" variant="primary" onClick={requestSnapshot} className="text-xs bg-teal-600 hover:bg-teal-500 py-1 px-3">
                        Refresh Screen Snapshot 📸
                      </Button>
                    </div>
                  )}

                  {/* Laser Cursor Overlay of Student — Anchored inside the phone screen */}
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

                  {/* Student Clicks Ripples */}
                  {recentClicks.map(c => (
                    <motion.div
                      key={c.id}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 3.5, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute pointer-events-none w-10 h-10 rounded-full border-4 border-rose-400 bg-rose-400/30 -translate-x-1/2 -translate-y-1/2 z-20"
                      style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    />
                  ))}

                  {/* Teacher Remote Clicks Ripples (Golden) */}
                  {teacherClicks.map(c => (
                    <motion.div
                      key={c.id}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 4, opacity: 0 }}
                      transition={{ duration: 0.9 }}
                      className="absolute pointer-events-none w-12 h-12 rounded-full border-4 border-amber-300 bg-amber-400/40 -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center text-[10px] font-black text-amber-200"
                      style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    />
                  ))}

                  {/* Remote Control Active Banner Overlay on Screen */}
                  {remoteControlActive && (
                    <div className="absolute top-2 right-2 bg-amber-500/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black text-slate-950 border border-amber-300 shadow flex items-center gap-1 pointer-events-none">
                      <Hand className="w-3 h-3 animate-bounce" />
                      <span>TAP SCREEN TO ASSIST</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Controls Bar — Clean 2-Row Layout */}
            <div className="w-full bg-slate-950/80 p-2 sm:p-2.5 rounded-2xl border border-slate-800 space-y-2">
              {/* Row 1: Primary Remote & Audio Controls */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Remote Assist Toggle */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setRemoteControlActive(!remoteControlActive)}
                    className={`text-xs flex items-center gap-1.5 py-1 px-3 ${
                      remoteControlActive
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold hover:bg-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Remote Assist: {remoteControlActive ? 'ON' : 'OFF'}</span>
                  </Button>

                  {/* Hide Usthad Cursor on Student Phone Toggle */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleHideUsthadCursor}
                    className={`text-xs flex items-center gap-1.5 py-1 px-3 ${
                      hideUsthadCursor
                        ? 'bg-purple-950 text-purple-300 border-purple-600/70 hover:bg-purple-900'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={hideUsthadCursor ? 'Usthad pointer/cursor is hidden on student phone' : 'Usthad pointer/cursor is shown on student phone'}
                  >
                    {hideUsthadCursor ? <EyeOff className="w-3.5 h-3.5 text-purple-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Usthad Cursor: {hideUsthadCursor ? 'Hidden on Phone 🙈' : 'Visible 👁️'}</span>
                  </Button>

                  {/* Sound Mute Toggle */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={toggleMuteAllSound}
                    className={`text-xs flex items-center gap-1.5 py-1 px-3 ${
                      muteAllSound
                        ? 'bg-rose-950 text-rose-300 border-rose-700 hover:bg-rose-900 font-bold'
                        : 'bg-slate-800 text-emerald-300 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={muteAllSound ? 'All sound is muted — Click to unmute' : 'Mute all audio for watcher & student'}
                  >
                    {muteAllSound ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{muteAllSound ? 'Sound: Muted 🔇' : 'Sound: ON 🔊'}</span>
                  </Button>
                </div>

                {/* Cheer in Arabic */}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={speakEncouragement}
                  className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 border-0 shadow-sm py-1 px-3.5 font-bold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sunny-300" />
                  <span>Cheer in Arabic 🌟</span>
                </Button>
              </div>

              {/* Row 2: Secondary Quick Actions & Navigation */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Scroll controls */}
                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3 text-slate-400" /> Scroll:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoteScroll(-220)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors flex items-center gap-0.5"
                      title="Scroll Up on student screen"
                    >
                      <ChevronUp className="w-3 h-3 text-teal-400" /> Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoteScroll(220)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors flex items-center gap-0.5"
                      title="Scroll Down on student screen"
                    >
                      <ChevronDown className="w-3 h-3 text-teal-400" /> Down
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoteScroll(-99999)}
                      className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors"
                      title="Scroll to Top on student screen"
                    >
                      Top
                    </button>
                  </div>

                  {/* Send Hint */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRemoteHint}
                    className="text-xs bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-700/60 flex items-center gap-1 py-0.5 px-2.5"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>Send Hint 💡</span>
                  </Button>

                  {/* Refresh Snapshot */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={requestSnapshot}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-teal-300 border-slate-700 flex items-center gap-1 py-0.5 px-2.5 shadow-sm"
                  >
                    <RotateCcw className="w-3 h-3 text-teal-400" />
                    <span>Refresh View 📸</span>
                  </Button>
                </div>

                {remoteFeedbackToast && (
                  <span className="text-xs font-bold text-amber-300 animate-pulse bg-amber-950 px-3 py-0.5 rounded-full border border-amber-500/40">
                    {remoteFeedbackToast}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Remote Control Station & Activity Feed */}
          <div className="p-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between space-y-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Tutor Remote Navigation Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Remote Activity Station</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Tutor Controls</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Choose Game:
                    </label>
                    <select
                      value={remoteGame}
                      onChange={e => setRemoteGame(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {CONTROL_GAMES.map(g => (
                        <option key={g.slug} value={g.slug}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Target Letter:
                    </label>
                    <select
                      value={remoteLetter}
                      onChange={e => setRemoteLetter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {ARABIC_LETTERS.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.letter} — {l.name_english} ({l.name_arabic})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleRemoteLaunch}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-2 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Launch on Student Screen 🚀</span>
                  </Button>
                </div>
              </div>

              {/* Instant Encouragement */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Instant Encouragement
                </h4>
                <div className="grid grid-cols-5 gap-1.5">
                  {['⭐', '🎉', '👏', '🏆', '❤️'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-brand-blue text-lg hover:scale-110 active:scale-95 transition-all text-center"
                      title={`Send ${emoji} to ${student.display_name}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>Interaction Log</span>
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activityFeed.map((msg, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] leading-tight text-slate-300"
                    >
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Session info */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-400 block text-[10px] uppercase">
                Active Student Status
              </span>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Current Game:</span>
                <span className="font-bold text-brand-blue capitalize">{viewportState.gameSlug.replace(/-/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Score / Accuracy:</span>
                <span className="font-bold text-emerald-400">{viewportState.score} pts ({viewportState.accuracy}%)</span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Remote Click:</span>
                <span className="font-bold text-amber-300">
                  {remoteControlActive ? 'Enabled 🎯' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Usthad Cursor:</span>
                <span className={`font-bold ${hideUsthadCursor ? 'text-purple-400' : 'text-blue-400'}`}>
                  {hideUsthadCursor ? 'Hidden on Phone 🙈' : 'Visible 👁️'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Audio Mode:</span>
                <span className={`font-bold ${muteAllSound ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {muteAllSound ? 'All Muted 🔇' : 'Sound ON 🔊'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
