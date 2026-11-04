import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSound, setGlobalMute } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'

export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true, isTouch: false, deviceType: 'desktop' as const }
  }
  const ua = navigator.userAgent || ''
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    (Boolean(isTouch) && window.innerWidth >= 600 && window.innerWidth <= 1024)
  const isMobile =
    !isTablet &&
    (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) ||
      (Boolean(isTouch) && window.innerWidth < 600))
  const deviceType = isTablet ? ('tablet' as const) : isMobile ? ('mobile' as const) : ('desktop' as const)
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet, isTouch: Boolean(isTouch), deviceType }
}

export function useStudentLiveStream() {
  const { user, profile, isStudent } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { playStar, playSparkle } = useSound()
  const { celebrate, celebrateBig } = useConfetti()

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null)
  const [screenShareRequested, setScreenShareRequested] = useState(false)
  const [mobileNoticeOpen, setMobileNoticeOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [remotePointer, setRemotePointer] = useState<{ x: number; y: number; teacherName: string; id: number } | null>(null)
  const [remoteNotice, setRemoteNotice] = useState<string | null>(null)

  const isDisplayMediaSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'

  // Determine if this client is functioning as a student on any device
  const isStudentUser =
    isStudent ||
    profile?.role === 'student' ||
    (typeof window !== 'undefined' && (
      !!localStorage.getItem('arabic_auth_session') ||
      !!new URLSearchParams(location.search).get('room') ||
      !!localStorage.getItem('arabic_student_room')
    ))

  // Stable device-unique ID so separate student devices don't collide
  const [deviceStudentId] = useState(() => {
    if (typeof window === 'undefined') return 'device_student'
    let id = localStorage.getItem('arabic_device_student_id')
    if (!id) {
      id = 'std_' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('arabic_device_student_id', id)
    }
    return id
  })

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const sharedChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastTouchTimeRef = useRef(0)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<any>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const isRemoteDescriptionSetRef = useRef(false)
  const isCapturingDomRef = useRef(false)

  const studentId = user?.id || (profile?.id ? profile.id : deviceStudentId)
  const studentName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    (typeof window !== 'undefined' ? localStorage.getItem('arabic_student_name') : null) ||
    'Student Explorer'

  // Helper to extract active game and letter from global store or URL
  const getActiveState = useCallback(() => {
    const globalState = (window as any).__ARABIC_ACTIVE_GAME__ || {}
    const searchParams = new URLSearchParams(location.search)
    const letterFromUrl = searchParams.get('letter')
    const pathname = location.pathname
    const dev = getDeviceInfo()

    let detectedSlug = globalState.gameSlug
    if (!detectedSlug && pathname.startsWith('/games/')) {
      detectedSlug = pathname.replace('/games/', '').split('?')[0]
    }

    return {
      pathname,
      search: location.search,
      gameSlug: detectedSlug || 'Alphabet Lesson',
      letterId: globalState.letterId || letterFromUrl || 'alef',
      score: globalState.score || 0,
      accuracy: globalState.accuracy || 100,
      status: globalState.status || (pathname.startsWith('/games') ? 'playing' : 'idle'),
      isMobile: dev.isMobile,
      isTablet: dev.isTablet,
      isDesktop: dev.isDesktop,
      deviceType: dev.deviceType,
      isDisplayMediaSupported,
    }
  }, [location.pathname, location.search, isDisplayMediaSupported])

  // ---------------------------------------------------------------------------
  // Capture & Broadcast Video Frame Snapshot (Image Stream from WebRTC stream)
  // ---------------------------------------------------------------------------
  const captureAndSendFrame = useCallback(() => {
    if (!streamRef.current || !hiddenVideoRef.current || !hiddenCanvasRef.current) return
    const video = hiddenVideoRef.current
    const canvas = hiddenCanvasRef.current

    // Wait until video has actual rendered frames from the screen
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = Math.min(800, video.videoWidth)
    canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)

      // Only send if not completely blank
      if (dataUrl && dataUrl.length > 500) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'screen_frame',
          payload: {
            student_id: studentId,
            image: dataUrl,
            timestamp: Date.now(),
            source: 'webrtc_video',
            deviceType: getDeviceInfo().deviceType,
          },
        }).catch(() => {})
      }
    } catch {}
  }, [studentId])

  // ---------------------------------------------------------------------------
  // Capture & Broadcast DOM Snapshot (for Tablets, Mobile & Tab Auto-Mirroring)
  // ---------------------------------------------------------------------------
  const captureAndSendDomSnapshot = useCallback(async () => {
    // If WebRTC live stream is active, the video frame loop handles updates
    if (streamRef.current) {
      captureAndSendFrame()
      return
    }
    if (typeof window === 'undefined' || isCapturingDomRef.current) return
    if (document.hidden) return

    isCapturingDomRef.current = true
    try {
      const target = document.getElementById('root') || document.body
      if (!target) return

      const scale = Math.min(1, 640 / Math.max(window.innerWidth, 1))

      const canvas = await html2canvas(target, {
        scale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#EAF5FF',
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        ignoreElements: (element) => {
          return (
            element.classList?.contains('student-live-ignore') ||
            element.id === 'arabic_screen_capture_v'
          )
        },
      })

      const dataUrl = canvas.toDataURL('image/jpeg', 0.52)
      if (dataUrl && dataUrl.length > 500) {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'screen_frame',
          payload: {
            student_id: studentId,
            image: dataUrl,
            timestamp: Date.now(),
            isDomSnapshot: true,
            deviceType: getDeviceInfo().deviceType,
          },
        }).catch(() => {})
      }
    } catch (e) {
      // Silently ignore snapshot errors
    } finally {
      isCapturingDomRef.current = false
    }
  }, [studentId, captureAndSendFrame])

  // ---------------------------------------------------------------------------
  // WebRTC Offer Generator (Called whenever teacher connects)
  // ---------------------------------------------------------------------------
  const sendFreshWebRtcOffer = useCallback(async () => {
    if (!streamRef.current) return

    try {
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close()
        } catch {}
      }

      isRemoteDescriptionSetRef.current = false
      iceCandidateQueueRef.current = []

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

      // Re-add tracks from active stream
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current!)
        track.onended = () => stopScreenShare()
      })

      pc.onicecandidate = event => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc_signal',
            payload: {
              type: 'candidate',
              student_id: studentId,
              candidate: event.candidate,
            },
          }).catch(() => {})
        }
      }

      const offer = await pc.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      })
      await pc.setLocalDescription(offer)

      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          type: 'offer',
          student_id: studentId,
          sdp: offer,
        },
      }).catch(() => {})

      channelRef.current?.send({
        type: 'broadcast',
        event: 'screen_status',
        payload: {
          student_id: studentId,
          active: true,
        },
      }).catch(() => {})

    } catch (err) {
      console.warn('Error generating WebRTC offer on student:', err)
    }
  }, [studentId])

  // ---------------------------------------------------------------------------
  // 1. Supabase Realtime Channels (Private Student Channel + Classroom Channel)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudentUser) return

    const channelName = `student_screen_${studentId}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })
    channelRef.current = channel

    // Persistent classroom broadcast channel for teacher live monitor
    const sharedChannel = supabase.channel('classroom_live_share', {
      config: { broadcast: { self: false } },
    })
    sharedChannelRef.current = sharedChannel

    sharedChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        const state = getActiveState()
        sharedChannel.send({
          type: 'broadcast',
          event: 'student_joined',
          payload: {
            student_id: studentId,
            display_name: studentName,
            ...state,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {})
      }
    })

    channel
      // Teacher opened the watcher modal -> immediately sync state & WebRTC offer / DOM snapshot!
      .on('broadcast', { event: 'teacher_joined' }, () => {
        const state = getActiveState()
        channel.send({
          type: 'broadcast',
          event: 'student_viewport',
          payload: {
            student_id: studentId,
            display_name: studentName,
            ...state,
            isScreenSharing: !!streamRef.current,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {})

        if (streamRef.current) {
          sendFreshWebRtcOffer()
          captureAndSendFrame()
        } else {
          // Immediately send fresh DOM snapshot so teacher sees the real screen!
          setTimeout(captureAndSendDomSnapshot, 150)
        }
      })

      // Teacher requests an instant screen snapshot
      .on('broadcast', { event: 'request_snapshot' }, () => {
        if (streamRef.current) {
          captureAndSendFrame()
        } else {
          captureAndSendDomSnapshot()
        }
      })

      // Teacher requests screen share
      .on('broadcast', { event: 'request_screen_share' }, () => {
        if (streamRef.current) {
          sendFreshWebRtcOffer()
          captureAndSendFrame()
        } else {
          setScreenShareRequested(true)
          playStar()
          // Send an immediate snapshot while student responds
          captureAndSendDomSnapshot()
          setTimeout(() => setScreenShareRequested(false), 14000)
        }
      })

      // Teacher sends cheer
      .on('broadcast', { event: 'teacher_reaction' }, ({ payload }) => {
        if (!payload?.reaction) return
        setIncomingReaction(payload.reaction)
        playSparkle()
        if (payload.reaction === '⭐' || payload.reaction === '🏆') {
          celebrateBig()
        } else {
          celebrate()
        }
        setTimeout(() => setIncomingReaction(null), 3500)
      })

      // Teacher remote control (click / navigate / hint / sound)
      .on('broadcast', { event: 'teacher_remote_control' }, ({ payload }) => {
        if (!payload) return

        if (payload.type === 'click') {
          const xPct = payload.xPct ?? 50
          const yPct = payload.yPct ?? 50
          const clientX = Math.round((xPct / 100) * window.innerWidth)
          const clientY = Math.round((yPct / 100) * window.innerHeight)

          // Only display visual pointer ripple if Usthad cursor is NOT hidden
          if (!payload.hideCursor) {
            setRemotePointer({
              x: clientX,
              y: clientY,
              teacherName: payload.teacherName || 'Ustadh Anshad',
              id: Date.now(),
            })
            if (!payload.muted) {
              playSparkle()
            }

            setTimeout(() => {
              setRemotePointer(prev => (prev?.id === payload.timestamp ? null : prev))
            }, 2400)
          }

          // Dispatch real click to DOM element under the point
          const el = document.elementFromPoint(clientX, clientY)
          if (el) {
            const clickable = (el.closest('button, a, [role="button"], input, select, textarea, [tabindex="0"]') || el) as HTMLElement
            if (clickable) {
              clickable.focus?.()
              clickable.click()

              const evtInit = {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
                screenX: clientX,
                screenY: clientY,
                view: window,
              }
              clickable.dispatchEvent(new PointerEvent('pointerdown', evtInit))
              clickable.dispatchEvent(new MouseEvent('mousedown', evtInit))
              clickable.dispatchEvent(new PointerEvent('pointerup', evtInit))
              clickable.dispatchEvent(new MouseEvent('mouseup', evtInit))
              clickable.dispatchEvent(new MouseEvent('click', evtInit))
            }
          }

          // Resend fresh DOM snapshot to teacher
          setTimeout(captureAndSendDomSnapshot, 350)
        } else if (payload.type === 'scroll') {
          const deltaY = payload.deltaY || 0
          window.scrollBy({ top: deltaY, behavior: 'smooth' })
          setTimeout(captureAndSendDomSnapshot, 300)
        } else if (payload.type === 'navigate' && payload.url) {
          playStar()
          setRemoteNotice(`Ustadh Anshad opened an activity for you! 🌟`)
          setTimeout(() => setRemoteNotice(null), 3500)
          navigate(payload.url)
          setTimeout(captureAndSendDomSnapshot, 600)
        } else if (payload.type === 'hint') {
          playSparkle()
          celebrate()
          setRemoteNotice(`Ustadh sent you a golden hint! 💡`)
          setTimeout(() => setRemoteNotice(null), 3500)
        } else if (payload.type === 'set_sound') {
          const shouldMute = Boolean(payload.muted)
          setGlobalMute(shouldMute)
        }
      })

      // Teacher sends WebRTC Answer & ICE candidates
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (!payload || !peerConnectionRef.current) return
        const pc = peerConnectionRef.current

        if (payload.type === 'answer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            isRemoteDescriptionSetRef.current = true
            while (iceCandidateQueueRef.current.length > 0) {
              const cand = iceCandidateQueueRef.current.shift()
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
            }
          } catch (e) {
            console.warn('Error setting remote description on student:', e)
          }
        } else if (payload.type === 'candidate' && payload.candidate) {
          if (!isRemoteDescriptionSetRef.current) {
            iceCandidateQueueRef.current.push(payload.candidate)
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            } catch (e) {
              console.warn('Error adding ICE candidate on student:', e)
            }
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(sharedChannel)
    }
  }, [
    studentId,
    isStudentUser,
    studentName,
    getActiveState,
    sendFreshWebRtcOffer,
    captureAndSendFrame,
    captureAndSendDomSnapshot,
    celebrate,
    celebrateBig,
    playSparkle,
    playStar,
    navigate,
  ])

  // ---------------------------------------------------------------------------
  // 2. Broadcast Route / Page Changes & Periodic State Heartbeat & DOM snapshots
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudentUser) return

    const sendState = () => {
      const state = getActiveState()
      const payload = {
        student_id: studentId,
        display_name: studentName,
        ...state,
        isScreenSharing: !!streamRef.current,
        timestamp: new Date().toISOString(),
      }

      if ((channelRef.current as any)?.state === 'joined') {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'student_viewport',
          payload,
        }).catch(() => {})
      }

      if ((sharedChannelRef.current as any)?.state === 'joined') {
        sharedChannelRef.current?.send({
          type: 'broadcast',
          event: 'student_viewport',
          payload,
        }).catch(() => {})
      }
    }

    sendState()
    const stateInterval = setInterval(sendState, 2000)

    // Periodic automatic DOM snapshot sync for mobile, tablet, and non-screensharing students
    const domSnapshotInterval = setInterval(() => {
      if (!streamRef.current && isStudentUser) {
        captureAndSendDomSnapshot()
      }
    }, 2200)

    return () => {
      clearInterval(stateInterval)
      clearInterval(domSnapshotInterval)
    }
  }, [location.pathname, location.search, studentId, studentName, isStudentUser, getActiveState, captureAndSendDomSnapshot])

  // Trigger immediate DOM snapshot on route change
  useEffect(() => {
    if (!isStudentUser) return
    const timer = setTimeout(() => {
      if (!streamRef.current) {
        captureAndSendDomSnapshot()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [location.pathname, location.search, isStudentUser, captureAndSendDomSnapshot])

  // ---------------------------------------------------------------------------
  // 3. Pointer Movements & Touches
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudentUser) return

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchTimeRef.current < 50) return
      lastTouchTimeRef.current = now

      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
      if (clientX === undefined || clientY === undefined) return

      const xPct = Math.round((clientX / window.innerWidth) * 1000) / 10
      const yPct = Math.round((clientY / window.innerHeight) * 1000) / 10

      channelRef.current?.send({
        type: 'broadcast',
        event: 'student_cursor',
        payload: {
          student_id: studentId,
          xPct,
          yPct,
          isClick: false,
          timestamp: now,
        },
      }).catch(() => {})
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const clientX = 'changedTouches' in e ? e.changedTouches[0]?.clientX : e.clientX
      const clientY = 'changedTouches' in e ? e.changedTouches[0]?.clientY : e.clientY
      if (clientX === undefined || clientY === undefined) return

      const xPct = Math.round((clientX / window.innerWidth) * 1000) / 10
      const yPct = Math.round((clientY / window.innerHeight) * 1000) / 10

      channelRef.current?.send({
        type: 'broadcast',
        event: 'student_cursor',
        payload: {
          student_id: studentId,
          xPct,
          yPct,
          isClick: true,
          timestamp: Date.now(),
        },
      }).catch(() => {})

      // Debounced DOM capture shortly after click to capture score / state changes
      setTimeout(() => {
        if (!streamRef.current) {
          captureAndSendDomSnapshot()
        }
      }, 500)
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('click', handleClick)
    }
  }, [studentId, isStudentUser, captureAndSendDomSnapshot])

  // ---------------------------------------------------------------------------
  // 4. Start Screen Share (Supports Existing Tab, Window, Full Screen & Mobile/Tablet)
  // ---------------------------------------------------------------------------
  const startScreenShare = useCallback(async (mode: 'tab' | 'window' | 'screen' = 'tab') => {
    try {
      if (!isDisplayMediaSupported) {
        // Fallback for devices without getDisplayMedia (e.g. iPhone Safari)
        captureAndSendDomSnapshot()
        setMobileNoticeOpen(true)
        setScreenShareRequested(false)
        return
      }

      // Display media constraints configured specifically to enable the existing tab as well as windows
      const displayMediaOptions: any = {
        video: {
          displaySurface: mode === 'window' ? 'window' : 'browser',
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
        preferCurrentTab: mode !== 'window',
        selfBrowserSurface: 'include',
        surfaceSwitching: 'include',
        systemAudio: 'exclude',
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          // Student cancelled screen picker
          return
        }
        // Fallback to basic getDisplayMedia if constraints were rejected by browser
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream
      setIsScreenSharing(true)
      setScreenShareRequested(false)
      setShareModalOpen(false)

      stream.getVideoTracks().forEach(track => {
        track.onended = () => stopScreenShare()
      })

      // Ensure offscreen video element is attached to DOM and playing for frame extraction
      let v = document.getElementById('arabic_screen_capture_v') as HTMLVideoElement
      if (!v) {
        v = document.createElement('video')
        v.id = 'arabic_screen_capture_v'
        v.autoplay = true
        v.muted = true
        v.playsInline = true
        v.style.position = 'fixed'
        v.style.left = '-9999px'
        v.style.top = '-9999px'
        v.style.width = '640px'
        v.style.height = '360px'
        v.style.opacity = '0'
        v.style.pointerEvents = 'none'
        document.body.appendChild(v)
      }
      hiddenVideoRef.current = v
      v.srcObject = stream
      await v.play().catch(() => {})

      if (!hiddenCanvasRef.current) {
        hiddenCanvasRef.current = document.createElement('canvas')
      }

      // Capture first frame on loadedmetadata
      v.onloadedmetadata = () => {
        setTimeout(captureAndSendFrame, 300)
      }

      // Stream frame snapshots every 1000ms
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = setInterval(captureAndSendFrame, 1000)

      // Send fresh WebRTC offer
      await sendFreshWebRtcOffer()

    } catch (err: any) {
      console.warn('Screen share canceled or failed:', err)
      setIsScreenSharing(false)
    }
  }, [isDisplayMediaSupported, captureAndSendDomSnapshot, captureAndSendFrame, sendFreshWebRtcOffer])

  const stopScreenShare = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    const v = document.getElementById('arabic_screen_capture_v')
    if (v) v.remove()

    setIsScreenSharing(false)

    channelRef.current?.send({
      type: 'broadcast',
      event: 'screen_status',
      payload: {
        student_id: studentId,
        active: false,
      },
    }).catch(() => {})

    // Resume DOM snapshot stream immediately after screen share stops
    setTimeout(captureAndSendDomSnapshot, 300)
  }, [studentId, captureAndSendDomSnapshot])

  return {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    incomingReaction,
    screenShareRequested,
    isDisplayMediaSupported,
    mobileNoticeOpen,
    setMobileNoticeOpen,
    shareModalOpen,
    setShareModalOpen,
    remotePointer,
    remoteNotice,
    deviceInfo: getDeviceInfo(),
    captureAndSendDomSnapshot,
  }
}
