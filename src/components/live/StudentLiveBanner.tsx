import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tv,
  X,
  Smartphone,
  Radio,
  CheckCircle2,
  Camera,
  Layers,
  Monitor,
  Sparkles,
  Info,
} from 'lucide-react'
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
    shareModalOpen,
    setShareModalOpen,
    remotePointer,
    remoteNotice,
    deviceInfo,
    captureAndSendDomSnapshot,
  } = useStudentLiveStream()

  const [snapshotSentToast, setSnapshotSentToast] = useState(false)

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

  const handleManualSnapshot = async () => {
    await captureAndSendDomSnapshot()
    setSnapshotSentToast(true)
    setTimeout(() => setSnapshotSentToast(false), 2500)
  }

  return (
    <>
      {/* Remote Pointer Ripple (Tutor Remote Click on Student Screen) */}
      <AnimatePresence>
        {remotePointer && (
          <motion.div
            key={remotePointer.id}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.2, opacity: 0 }}
            style={{ left: `${remotePointer.x}px`, top: `${remotePointer.y}px` }}
            className="student-live-ignore fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999]"
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-sunny-400 opacity-80" />
              <span className="animate-pulse absolute inline-flex h-12 w-12 rounded-full bg-amber-300 opacity-90" />
              <div className="relative w-9 h-9 rounded-full bg-brand-blue border-2 border-white shadow-2xl flex items-center justify-center text-white text-base">
                👆
              </div>
              <div className="absolute top-10 whitespace-nowrap bg-slate-900/95 text-sunny-300 text-xs font-black px-3 py-1 rounded-full shadow-2xl border border-sunny-400/50 flex items-center gap-1">
                <span>✨</span>
                <span>{remotePointer.teacherName} assisted here!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remote Activity Navigation Notification */}
      <AnimatePresence>
        {remoteNotice && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="student-live-ignore fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-sm px-6 py-3 rounded-full shadow-2xl border-2 border-white/50 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-sunny-300 animate-spin" />
            <span>{remoteNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Teacher Encouragement Sticker Pop-up */}
      <AnimatePresence>
        {incomingReaction && (
          <motion.div
            initial={{ scale: 0.3, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: -50, opacity: 0 }}
            className="student-live-ignore fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4"
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

      {/* Snapshot Sent Feedback Notification */}
      <AnimatePresence>
        {snapshotSentToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="student-live-ignore fixed bottom-16 right-4 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400"
          >
            <Sparkles className="w-4 h-4 text-sunny-300 animate-spin" />
            <span>Fresh screen view sent to Ustadh! 📸</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Screen & Tab Sharing Selector Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="student-live-ignore fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border-4 border-blue-200 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-2xl">
                    {deviceInfo.isDesktop ? '📺' : '📱'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800">
                      Share Screen with Teacher
                    </h3>
                    <p className="text-xs text-gray-500">
                      {deviceInfo.isDesktop
                        ? 'Choose what you want Ustadh to see on your laptop'
                        : 'Live screen sharing and auto-mirroring options'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {deviceInfo.isDesktop ? (
                /* Laptop / Desktop Options: Tab vs Window */
                <div className="space-y-3">
                  {/* Option 1: Existing Tab (Recommended) */}
                  <div
                    onClick={() => startScreenShare('tab')}
                    className="p-4 rounded-2xl border-2 border-brand-blue bg-blue-50/70 hover:bg-blue-100/70 transition-all cursor-pointer space-y-1.5 group relative"
                  >
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Recommended
                    </span>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-brand-blue group-hover:scale-110 transition-transform" />
                      <h4 className="font-extrabold text-brand-blue text-sm">
                        This Tab: Learn Arabic
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Shares just your Arabic game tab! Fast, clear, and keeps your other tabs and private windows completely hidden.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-brand-blue">
                      <span>Click to select this tab</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Option 2: Full Window */}
                  <div
                    onClick={() => startScreenShare('window')}
                    className="p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" />
                      <h4 className="font-extrabold text-gray-800 text-sm">
                        Entire Window or Screen
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Shares your whole browser window or full desktop monitor.
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-gray-600">
                      <span>Click to choose window</span>
                      <span>→</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Helpful Tip:</strong> In the browser dialog, click <strong>"This Tab"</strong> (or <strong>"Chrome Tab"</strong>) and select <strong>"Learn Arabic with Anshad"</strong>.
                    </span>
                  </div>
                </div>
              ) : (
                /* Tablet / Mobile Options */
                <div className="space-y-3">
                  {isDisplayMediaSupported && (
                    <div
                      onClick={() => startScreenShare('screen')}
                      className="p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-center gap-2">
                        <Tv className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <h4 className="font-extrabold text-emerald-900 text-sm">
                          Start Live Screen Share 📱
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Broadcast your real tablet or phone screen directly to your teacher in HD video!
                      </p>
                    </div>
                  )}

                  <div
                    onClick={handleManualSnapshot}
                    className="p-4 rounded-2xl border-2 border-teal-300 bg-teal-50/70 hover:bg-teal-100/70 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                      <h4 className="font-extrabold text-teal-900 text-sm">
                        Take Fresh Screen Snapshot 📸
                      </h4>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Instantly sends a snapshot of your exact screen and game score to Ustadh.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-semibold text-blue-900 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automatic live mirror is running in background</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Your touch taps & letter choices are synced live</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => setShareModalOpen(false)}
                className="w-full text-xs py-2 font-bold"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Mobile Live Sync Info Modal */}
      <AnimatePresence>
        {mobileNoticeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="student-live-ignore fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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
                  Live Screen Mirror Active!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  You are playing on a mobile or tablet device. Your real screen and game actions are streaming to your teacher!
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 text-left space-y-2 border border-emerald-100 text-xs font-semibold text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real Screen Snapshots: <strong>Streaming Live</strong></span>
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

              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  onClick={handleManualSnapshot}
                  className="w-full bg-teal-600 hover:bg-teal-700 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Send Fresh Screen Snapshot 📸</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setMobileNoticeOpen(false)}
                  className="w-full py-2 font-bold text-xs"
                >
                  Back to Learning 🚀
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Teacher Screen Request Banner */}
      <AnimatePresence>
        {screenShareRequested && !isScreenSharing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="student-live-ignore fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4"
          >
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 border-2 border-white/20">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-sunny-300 animate-pulse shrink-0" />
                <div className="text-xs">
                  <span className="font-extrabold block text-sm">Ustadh wants to watch! 📺</span>
                  <span className="text-blue-100">
                    {deviceInfo.isDesktop
                      ? 'Share your current tab or window with your teacher!'
                      : 'Share your screen so teacher can see you play!'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {deviceInfo.isDesktop ? (
                  <>
                    <Button
                      size="sm"
                      variant="sunny"
                      onClick={() => startScreenShare('tab')}
                      className="text-xs py-2 px-3 shadow font-bold"
                    >
                      <span>Share Tab 🚀</span>
                    </Button>
                    <button
                      onClick={() => setShareModalOpen(true)}
                      className="text-[11px] underline text-blue-100 hover:text-white font-semibold"
                    >
                      More
                    </button>
                  </>
                ) : isDisplayMediaSupported ? (
                  <Button
                    size="sm"
                    variant="sunny"
                    onClick={() => startScreenShare('screen')}
                    className="text-xs py-2 px-3 shadow font-bold"
                  >
                    <span>Share Screen 📱</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="sunny"
                    onClick={handleManualSnapshot}
                    className="text-xs py-2 px-3 shadow font-bold"
                  >
                    <span>Sync Screen 📸</span>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Floating Bottom-Right Screen Share / Mobile Mirror Indicator */}
      <div className="student-live-ignore fixed bottom-4 right-4 z-40 select-none">
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
        ) : deviceInfo.isDesktop ? (
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-gray-700 hover:text-brand-blue px-3.5 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold border border-blue-200 group"
          >
            <Tv className="w-3.5 h-3.5 text-brand-blue group-hover:scale-110 transition-transform" />
            <span>Share Tab / Screen 📺</span>
          </button>
        ) : deviceInfo.isTablet ? (
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 hover:bg-white text-teal-800 px-3.5 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold border border-teal-300 group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <Smartphone className="w-3.5 h-3.5 text-teal-600" />
            <span>Tablet Mirrored Live 📱</span>
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
