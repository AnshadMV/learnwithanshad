import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Eye, Sparkles, CheckCircle2, Database, Wifi, RefreshCw, XCircle, ShieldCheck } from 'lucide-react'
import { useSound } from '@/hooks/useSound'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'

interface SupabaseStatus {
  tested: boolean
  testing: boolean
  authOnline: boolean
  dbConnected: boolean
  dbDetails: string
  latencyMs: number | null
  error?: string
}

export default function SettingsPage() {
  const { isMuted, toggleMute } = useSound()
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')
  const [savedMsg, setSavedMsg] = useState(false)

  const [dbStatus, setDbStatus] = useState<SupabaseStatus>({
    tested: false,
    testing: false,
    authOnline: false,
    dbConnected: false,
    dbDetails: 'Not tested yet',
    latencyMs: null,
  })

  useEffect(() => {
    const savedAnim = localStorage.getItem('arabic_anim')
    if (savedAnim !== null) {
      setAnimationsEnabled(savedAnim === 'true')
    }
    // Test Supabase connection on load
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    setDbStatus(prev => ({ ...prev, testing: true }))
    const start = performance.now()
    try {
      // 1. Test Auth endpoint
      const authPromise = supabase.auth.getSession()
      
      // 2. Test DB table query
      const dbPromise = supabase.from('arabic_letters').select('id', { count: 'exact', head: true })

      const [authRes, dbRes] = await Promise.all([authPromise, dbPromise])
      const elapsed = Math.round(performance.now() - start)

      const dbSuccess = !dbRes.error
      const dbInfo = dbSuccess
        ? `Connected (${dbRes.count ?? 28} letters registered in database)`
        : `Table query: ${dbRes.error?.message || 'Table pending migration'}`

      setDbStatus({
        tested: true,
        testing: false,
        authOnline: !authRes.error,
        dbConnected: dbSuccess,
        dbDetails: dbInfo,
        latencyMs: elapsed,
      })
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start)
      setDbStatus({
        tested: true,
        testing: false,
        authOnline: false,
        dbConnected: false,
        dbDetails: 'Failed to reach Supabase backend',
        latencyMs: elapsed,
        error: err?.message || 'Network timeout or unreachable host',
      })
    }
  }

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
          Customize sound, animations, letter sizing, and verify cloud backend connectivity.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved!</span>
        </div>
      )}

      {/* Supabase Connection Diagnostics Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border-2 border-blue-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center text-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Supabase Cloud Status</h3>
              <p className="text-xs text-gray-400 font-mono">
                {import.meta.env.VITE_SUPABASE_URL || 'https://omrddkzpwchbfkvtzvos.supabase.co'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={testSupabaseConnection}
            loading={dbStatus.testing}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Test Connection</span>
          </Button>
        </div>

        {dbStatus.tested && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-sky/50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {dbStatus.authOnline ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className="text-xs font-bold text-gray-700">Auth Service</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${dbStatus.authOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {dbStatus.authOnline ? 'Connected' : 'Offline / Error'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky/50 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {dbStatus.dbConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <span className="text-xs font-bold text-gray-700">Database Tables</span>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${dbStatus.dbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {dbStatus.dbConnected ? 'Active' : 'Pending Seed'}
              </span>
            </div>

            <div className="sm:col-span-2 text-xs px-2 text-gray-500 flex items-center justify-between">
              <span>{dbStatus.dbDetails}</span>
              {dbStatus.latencyMs !== null && (
                <span className="font-mono text-gray-400">{dbStatus.latencyMs}ms latency</span>
              )}
            </div>
          </div>
        )}
      </div>

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
            variant={animationsEnabled ? 'primary' : 'secondary'}
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
