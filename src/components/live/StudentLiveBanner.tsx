import { motion, AnimatePresence } from 'framer-motion'
import { Tv, Sparkles, X, Check, Smartphone, Radio, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudentLiveStream } from '@/hooks/useStudentLiveStream'
import Button from '@/components/ui/Button'

export default function StudentLiveBanner() {
  const { isStudent, profile } = useAuth()
  const {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    incomingReaction,
    screenShareRequested,
    isDisplayMediaSupported,
    mobileNoticeOpen,
    setMobileNoticeOpen,
  } = useStudentLiveStream()

  const isStudentUser =
    isStudent ||
    profile?.role === 'student' ||
    (typeof window !== 'undefined' && (
      !!localStorage.getItem('arabic_auth_session') ||
      !!new URLSearchParams(window.location.search).get('room') ||
      !!localStorage.getItem('arabic_student_room')
    ))

  if (!isStudentUser) {
    return null
  }

  return (
    <>
      {/* 1. Teacher Encouragement Sticker Pop-up */}
      <AnimatePresence>
        {incomingReaction && (
          <motion.div
            initial={{ scale: 0.3, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-sunny-300 text-center space-y-3 max-w-sm pointer-events-auto animate-bounce-gentle">
              <div className="text-7xl animate-pulse">{incomingReaction}</div>
              <h3 className="text-2xl font-black text-gray-800 font-display">
                Great Job, {profile?.display_name || 'Little Explorer'}!
              </h3>
              <p className="text-sm font-bold text-brand-blue">
                Ustadh sent you a special cheer! 🌟
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Mobile Live Sync Info Modal */}
      <AnimatePresence>
        {mobileNoticeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border-4 border-emerald-300 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl">
                📱
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">
                  Mobile Live Sync Active!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  You are playing on a mobile browser. Your game session is connected to your teacher!
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 text-left space-y-2 border border-emerald-100 text-xs font-semibold text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Active Game & Letter: <strong>Synced Live</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Screen Touches & Moves: <strong>Mirrored</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Score & Accuracy: <strong>Real-time</strong></span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setMobileNoticeOpen(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold"
              >
                Back to Learning 🚀
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Teacher Screen Request Banner */}
      <AnimatePresence>
        {screenShareRequested && !isScreenSharing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            {isDisplayMediaSupported ? (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 border-2 border-white/20">
                <div className="flex items-center gap-2.5">
                  <Tv className="w-5 h-5 text-sunny-300 animate-pulse shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold block text-sm">Ustadh wants to watch! 📺</span>
                    <span className="text-blue-100">Share your screen so teacher can see you play!</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="sunny"
                  onClick={startScreenShare}
                  className="shrink-0 text-xs py-2 px-3 shadow"
                >
                  <span>Share Screen</span>
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 border-2 border-white/20">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-5 h-5 text-sunny-300 animate-pulse shrink-0" />
                  <div className="text-xs">
                    <span className="font-extrabold block text-sm">Ustadh is watching live! 📺</span>
                    <span className="text-teal-100">Your touches and games are mirrored live!</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="sunny"
                  onClick={() => setMobileNoticeOpen(true)}
                  className="shrink-0 text-xs py-2 px-3 shadow"
                >
                  <span>View Status 📱</span>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Floating Bottom-Right Screen Share / Mobile Mirror Indicator */}
      <div className="fixed bottom-4 right-4 z-40 select-none">
        {isScreenSharing ? (
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-bold border-2 border-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span>Live Screen Streaming</span>
            <button
              onClick={stopScreenShare}
              className="ml-1 bg-black/20 hover:bg-black/30 rounded-full p-1"
              title="Stop sharing"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : isDisplayMediaSupported ? (
          <button
            onClick={startScreenShare}
            className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-brand-blue px-3 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold border border-blue-200 group"
          >
            <Tv className="w-3.5 h-3.5 text-brand-blue group-hover:scale-110 transition-transform" />
            <span>Share Screen with Teacher 📺</span>
          </button>
        ) : (
          <button
            onClick={() => setMobileNoticeOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-emerald-700 px-3.5 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold border border-emerald-300 group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Mirrored to Ustadh 📱</span>
          </button>
        )}
      </div>
    </>
  )
}
