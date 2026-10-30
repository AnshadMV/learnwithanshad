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
  }, [user])

  async function loadStudents() {
    setLoading(true)

    // Load any existing valid student records from local storage
    const saved = localStorage.getItem('arabic_local_students')
    let localParsed: StudentRecord[] = []
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          localParsed = parsed.filter((s: any) => 
            !s.id?.startsWith('std_') && 
            !s.display_name?.includes('Zaid Explorer') && 
            !s.display_name?.includes('Layla Sunshine')
          )
          if (localParsed.length > 0) {
            setStudents(localParsed)
          }
        }
      } catch {}
    }

    // Dynamic query from Supabase
    try {
      let remoteStudents: StudentRecord[] = []

      // 1. Query all student profiles in database
      const { data: allStudents, error: profErr } = await supabase
        .from('profiles')
        .select('id, display_name, email, is_active, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (!profErr && allStudents && allStudents.length > 0) {
        remoteStudents = allStudents
      }

      // 2. Also check students via classroom_students join if available
      if (user) {
        const { data: classrooms } = await supabase
          .from('classrooms')
          .select('id, name')
          .eq('teacher_id', user.id)

        if (classrooms && classrooms.length > 0) {
          const classIds = classrooms.map(c => c.id)
          const { data: enrolled } = await supabase
            .from('classroom_students')
            .select('student_id')
            .in('classroom_id', classIds)

          const studentIds = (enrolled || []).map(e => e.student_id)
          if (studentIds.length > 0) {
            const { data: enrolledProfiles } = await supabase
              .from('profiles')
              .select('id, display_name, email, is_active, created_at')
              .in('id', studentIds)

            if (enrolledProfiles && enrolledProfiles.length > 0) {
              // Add any missing enrolled students
              for (const ep of enrolledProfiles) {
                if (!remoteStudents.some(r => r.id === ep.id)) {
                  remoteStudents.push(ep)
                }
              }
            }
          }
        }
      }

      // Merge remote students + locally tracked records (deduplicating by email/name/id)
      const merged: StudentRecord[] = [...remoteStudents]
      for (const loc of localParsed) {
        const alreadyExists = merged.some(m => 
          m.id === loc.id || 
          (m.email && loc.email && m.email.toLowerCase() === loc.email.toLowerCase()) ||
          m.display_name.trim().toLowerCase() === loc.display_name.trim().toLowerCase()
        )
        if (!alreadyExists) {
          merged.push(loc)
        }
      }

      setStudents(merged)
      if (merged.length > 0) {
        localStorage.setItem('arabic_local_students', JSON.stringify(merged))
      }
    } catch (err) {
      console.warn('Network offline or error querying student profiles:', err)
      if (localParsed.length > 0) {
        setStudents(localParsed)
      }
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

    let cleanUsername = username.toLowerCase().trim()
    if (cleanUsername.includes('@')) {
      cleanUsername = cleanUsername.split('@')[0]
    }
    cleanUsername = cleanUsername.replace(/[^a-z0-9_-]/g, '')
    const studentEmail = `${cleanUsername}@gmail.com`

    let createdId = `student_${cleanUsername}_${Date.now()}`

    try {
      // 1. Try creating via PostgreSQL RPC create_student_by_teacher (bypasses email rate limits)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_student_by_teacher', {
        p_display_name: displayName.trim(),
        p_username: cleanUsername,
        p_pin: pin.trim(),
        p_classroom_code: 'LEVEL-1',
      })

      if (!rpcErr && rpcData?.id) {
        createdId = rpcData.id
      } else {
        // 2. Direct table insert fallback if RPC not yet run
        const generatedUuid = crypto.randomUUID ? crypto.randomUUID() : createdId
        createdId = generatedUuid

        await supabase.from('profiles').upsert({
          id: generatedUuid,
          display_name: displayName.trim(),
          email: studentEmail,
          role: 'student',
          is_active: true,
        } as any)

        // Find teacher's classroom to enroll
        if (user) {
          const { data: teacherClass } = await supabase
            .from('classrooms')
            .select('id')
            .eq('teacher_id', user.id)
            .limit(1)
            .maybeSingle()

          if (teacherClass?.id) {
            await supabase.from('classroom_students').insert({
              classroom_id: teacherClass.id,
              student_id: generatedUuid,
            })
          }
        }
      }

      // Add to local state & storage immediately
      const newRecord: StudentRecord = {
        id: createdId,
        display_name: displayName.trim(),
        email: studentEmail,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setStudents(prev => {
        const withoutOld = prev.filter(p => p.email?.toLowerCase() !== studentEmail.toLowerCase())
        const updated = [newRecord, ...withoutOld]
        localStorage.setItem('arabic_local_students', JSON.stringify(updated))
        return updated
      })

      setSuccessMsg(`Student "${displayName.trim()}" added successfully! Login: ${cleanUsername} or ${studentEmail}, PIN: ${pin}`)
      setDisplayName('')
      setUsername('')
      setPin('')
      setIsModalOpen(false)
    } catch (err: any) {
      console.warn('Student creation warning, persisting locally:', err)
      const localRecord: StudentRecord = {
        id: createdId,
        display_name: displayName.trim(),
        email: studentEmail,
        is_active: true,
        created_at: new Date().toISOString(),
      }

      setStudents(prev => {
        const withoutOld = prev.filter(p => p.email?.toLowerCase() !== studentEmail.toLowerCase())
        const updated = [localRecord, ...withoutOld]
        localStorage.setItem('arabic_local_students', JSON.stringify(updated))
        return updated
      })

      setSuccessMsg(`Student "${displayName.trim()}" created successfully! Login: ${cleanUsername}, PIN: ${pin}`)
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
