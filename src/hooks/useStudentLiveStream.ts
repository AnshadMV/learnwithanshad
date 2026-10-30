import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useSound } from '@/hooks/useSound'
import { useConfetti } from '@/hooks/useConfetti'

export function useStudentLiveStream() {
  const { user, profile, isStudent } = useAuth()
  const location = useLocation()
  const { playStar, playSparkle } = useSound()
  const { celebrate, celebrateBig } = useConfetti()

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [incomingReaction, setIncomingReaction] = useState<string | null>(null)
  const [screenShareRequested, setScreenShareRequested] = useState(false)
  const [mobileNoticeOpen, setMobileNoticeOpen] = useState(false)

  const isDisplayMediaSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const lastTouchTimeRef = useRef(0)
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null)
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<any>(null)
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([])
  const isRemoteDescriptionSetRef = useRef(false)

  const studentId = user?.id || (profile?.id ? profile.id : 'anon_student')
  const studentName = profile?.display_name || user?.email?.split('@')[0] || 'Student'

  // Helper to extract active game and letter from global store or URL
  const getActiveState = useCallback(() => {
    const globalState = (window as any).__ARABIC_ACTIVE_GAME__ || {}
    const searchParams = new URLSearchParams(location.search)
    const letterFromUrl = searchParams.get('letter')
    const pathname = location.pathname

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
      isMobile: !isDisplayMediaSupported,
      deviceType: isDisplayMediaSupported ? 'desktop' : 'mobile',
    }
  }, [location.pathname, location.search, isDisplayMediaSupported])

  // ---------------------------------------------------------------------------
  // Capture & Broadcast Video Frame Snapshot (Image Stream)
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
          },
        }).catch(() => {})
      }
    } catch {}
  }, [studentId])

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
  // 1. Supabase Realtime Channel
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudent && !profile?.role?.includes('student')) return

    const channelName = `student_screen_${studentId}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    })

    channelRef.current = channel

    channel
      // Teacher opened the watcher modal -> immediately sync state & WebRTC offer!
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
          setTimeout(() => setScreenShareRequested(false), 12000)
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

      // Teacher sends WebRTC Answer & ICE candidates
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        if (!payload || !peerConnectionRef.current) return
        const pc = peerConnectionRef.current

        if (payload.type === 'answer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            isRemoteDescriptionSetRef.current = true
            // Process queued ICE candidates
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
    }
  }, [studentId, isStudent, profile?.role, getActiveState, sendFreshWebRtcOffer, captureAndSendFrame])

  // ---------------------------------------------------------------------------
  // 2. Broadcast Route / Page Changes & Periodic State Heartbeat
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudent && profile?.role !== 'student') return

    const sendState = () => {
      const state = getActiveState()
      const payload = {
        student_id: studentId,
        display_name: studentName,
        ...state,
        isScreenSharing: !!streamRef.current,
        timestamp: new Date().toISOString(),
      }

      channelRef.current?.send({
        type: 'broadcast',
        event: 'student_viewport',
        payload,
      }).catch(() => {})

      try {
        const sharedChannel = supabase.channel('classroom_live_share')
        sharedChannel.send({
          type: 'broadcast',
          event: 'student_viewport',
          payload,
        }).catch(() => {})
      } catch {}
    }

    sendState()
    const interval = setInterval(sendState, 2000)
    return () => clearInterval(interval)
  }, [location.pathname, location.search, studentId, studentName, isStudent, profile?.role, getActiveState])

  // ---------------------------------------------------------------------------
  // 3. Pointer Movements & Touches
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isStudent && profile?.role !== 'student') return

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
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('click', handleClick, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('click', handleClick)
    }
  }, [studentId, isStudent, profile?.role])

  // ---------------------------------------------------------------------------
  // 4. Start Screen Share
  // ---------------------------------------------------------------------------
  const startScreenShare = useCallback(async () => {
    try {
      if (!isDisplayMediaSupported) {
        setMobileNoticeOpen(true)
        setScreenShareRequested(false)
        return
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      })

      streamRef.current = stream
      setIsScreenSharing(true)
      setScreenShareRequested(false)

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
  }, [sendFreshWebRtcOffer, captureAndSendFrame])

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
  }, [studentId])

  return {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    incomingReaction,
    screenShareRequested,
    isDisplayMediaSupported,
    mobileNoticeOpen,
    setMobileNoticeOpen,
  }
}
