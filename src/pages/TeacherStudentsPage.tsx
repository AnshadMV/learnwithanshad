import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, UserPlus, KeyRound, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface StudentRecord {
  id: string
  display_name: string
  email: string | null
  is_active: boolean
  created_at: string
}

export default function TeacherStudentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadStudents()
  }, [])

  async function loadStudents() {
    setLoading(true)

    // Check local storage first
    const saved = localStorage.getItem('arabic_local_students')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudents(parsed)
          setLoading(false)
        }
      } catch {}
    } else {
      const defaultDemoStudents: StudentRecord[] = [
        { id: 'std_1', display_name: 'Zaid Explorer', email: 'zaid@student.arabiclearn.local', is_active: true, created_at: new Date().toISOString() },
        { id: 'std_2', display_name: 'Layla Sunshine', email: 'layla@student.arabiclearn.local', is_active: true, created_at: new Date().toISOString() },
        { id: 'std_3', display_name: 'Omar Falcon', email: 'omar@student.arabiclearn.local', is_active: true, created_at: new Date().toISOString() },
        { id: 'std_4', display_name: 'Fatima Star', email: 'fatima@student.arabiclearn.local', is_active: true, created_at: new Date().toISOString() },
      ]
      setStudents(defaultDemoStudents)
      localStorage.setItem('arabic_local_students', JSON.stringify(defaultDemoStudents))
      setLoading(false)
    }

    // Attempt remote fetch
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, is_active, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setStudents(data)
      }
    } catch (err) {
      // Supabase offline / network timeout
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim() || !username.trim() || !pin.trim()) {
      setErrorMsg('All fields are required.')
      return
    }

    setCreating(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    const studentEmail = `${cleanUsername}@student.arabiclearn.local`

    try {
      // 1. Attempt Supabase registration
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: studentEmail,
        password: `pin_${pin.trim()}`,
        options: {
          data: {
            display_name: displayName.trim(),
            role: 'student',
          },
        },
      })

      if (authErr && !authErr.message.includes('fetch')) {
        setErrorMsg(authErr.message)
        return
      }

      if (authData?.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          display_name: displayName.trim(),
          email: studentEmail,
          role: 'student',
          is_active: true,
        } as any)
      }

      // Add to local state and localStorage
      const newRecord: StudentRecord = {
        id: authData?.user?.id || `student_${cleanUsername}_${Date.now()}`,
        display_name: displayName.trim(),
        email: studentEmail,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setStudents(prev => {
        const updated = [newRecord, ...prev]
        localStorage.setItem('arabic_local_students', JSON.stringify(updated))
        return updated
      })

      setSuccessMsg(`Student "${displayName}" added successfully! Login ID: ${cleanUsername}, PIN: ${pin}`)
      setDisplayName('')
      setUsername('')
      setPin('')
      setIsModalOpen(false)
    } catch (err: any) {
      // Local fallback creation
      const localRecord: StudentRecord = {
        id: `student_${cleanUsername}_${Date.now()}`,
        display_name: displayName.trim(),
        email: studentEmail,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setStudents(prev => {
        const updated = [localRecord, ...prev]
        localStorage.setItem('arabic_local_students', JSON.stringify(updated))
        return updated
      })

      setSuccessMsg(`Student "${displayName}" added successfully! Login ID: ${cleanUsername}, PIN: ${pin}`)
      setDisplayName('')
      setUsername('')
      setPin('')
      setIsModalOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    setStudents(prev => {
      const updated = prev.map(s => (s.id === studentId ? { ...s, is_active: !currentStatus } : s))
      localStorage.setItem('arabic_local_students', JSON.stringify(updated))
      return updated
    })

    try {
      await supabase
        .from('profiles')
        .update({ is_active: !currentStatus } as any)
        .eq('id', studentId)
    } catch (err) {
      console.warn('Updated student status locally.')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/teacher/dashboard')}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Student Management</h1>
            <p className="text-xs text-gray-400">Issue student usernames and 4-digit secret PINs</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Student</span>
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Enrolled Students ({students.length})</h2>
          <span className="text-xs text-gray-400">Only authorized teachers can view credentials</span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-600">No students enrolled yet</p>
            <p className="text-xs mt-1">Click "Add New Student" to issue credentials for your class.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {students.map(s => {
              const usernameDisplay = s.email ? s.email.split('@')[0] : 'student'
              return (
                <div
                  key={s.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-brand-blue font-bold flex items-center justify-center text-base">
                      {s.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{s.display_name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>Username: <strong className="text-brand-blue font-mono">{usernameDisplay}</strong></span>
                        <span>•</span>
                        <span className={s.is_active ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                          {s.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleStudentStatus(s.id, s.is_active)}
                      className={`text-xs ${s.is_active ? 'text-gray-500' : 'text-emerald-600'}`}
                    >
                      {s.is_active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                    <Link
                      to="/teacher/live"
                      className="text-xs font-bold text-brand-blue hover:underline px-3 py-1.5"
                    >
                      View Live Activity →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Student Credentials">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Maya Ahmad"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Login Username
            </label>
            <input
              type="text"
              placeholder="e.g. maya24"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              4-Digit PIN
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="1234"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-mono tracking-widest"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={creating}>
              Create Student Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
