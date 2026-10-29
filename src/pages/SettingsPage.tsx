import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Eye, Moon, Sparkles, CheckCircle2 } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import Button from '@/components/ui/Button'

export default function SettingsPage() {
  const { isMuted, toggleMute } = useSound()
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    const savedAnim = localStorage.getItem('arabic_anim')
    if (savedAnim !== null) {
      setAnimationsEnabled(savedAnim === 'true')
    }
  }, [])

  const handleToggleAnim = () => {
    const nextVal = !animationsEnabled
    setAnimationsEnabled(nextVal)
    localStorage.setItem('arabic_anim', String(nextVal))
    showFeedback()
  }

  const handleFontSizeChange = (size: 'normal' | 'large') => {
    setFontSize(size)
    localStorage.setItem('arabic_font_size', size)
    showFeedback()
  }

  const showFeedback = () => {
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-800 font-display">Accessibility & Settings</h1>
        <p className="text-gray-500 text-sm">
          Customize sound, animations, and letter sizing for young children.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved!</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card space-y-6 divide-y divide-gray-100">
        {/* Sound */}
        <div className="flex items-center justify-between pt-4 first:pt-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-xl">
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Sound Effects & Pronunciation</h3>
              <p className="text-xs text-gray-400">Audio playback for letters, success chimes, and praise</p>
            </div>
          </div>
          <Button
            variant={isMuted ? 'secondary' : 'primary'}
            size="sm"
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute' : 'Muted'}
          </Button>
        </div>

        {/* Animations */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sunny-100 text-sunny-600 flex items-center justify-center text-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Playful Motion & Confetti</h3>
              <p className="text-xs text-gray-400">Celebration stars, floating balloons, and animated cards</p>
            </div>
          </div>
          <Button
            variant={animationsEnabled ? 'success' : 'secondary'}
            size="sm"
            onClick={handleToggleAnim}
          >
            {animationsEnabled ? 'Enabled' : 'Reduced'}
          </Button>
        </div>

        {/* Text size */}
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Arabic Letter Size</h3>
              <p className="text-xs text-gray-400">Extra large display for tablets and classroom screens</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={fontSize === 'normal' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFontSizeChange('normal')}
            >
              Standard
            </Button>
            <Button
              variant={fontSize === 'large' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleFontSizeChange('large')}
            >
              Extra Large
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
