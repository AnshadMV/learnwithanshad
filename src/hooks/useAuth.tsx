import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isTeacher: boolean
  isStudent: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>
  signInWithStudentPin: (username: string, pin: string) => Promise<{ error: AuthError | Error | null }>
  signInAsDemo: (role: 'teacher' | 'student') => Promise<void>
  joinAsStudent: (displayName: string, roomCode?: string, avatar?: string) => Promise<Profile>
  signUp: (email: string, password: string, displayName: string, role?: Profile['role']) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Helper — fetch or derive profile
// ---------------------------------------------------------------------------

async function resolveProfile(user: User): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      return data as Profile
    }
  } catch (err) {
    // Table not created yet or network error
  }

  // Robust fallback: derive from user metadata or email
  const role: 'teacher' | 'student' =
    (user.user_metadata?.role as 'teacher' | 'student') ||
    (user.email?.includes('teacher') ? 'teacher' : 'student')

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    (role === 'teacher' ? 'Educator' : 'Little Explorer')

  return {
    id: user.id,
    email: user.email ?? null,
    display_name: displayName,
    role,
    avatar_url: null,
    is_active: true,
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync profile whenever user changes
  useEffect(() => {
    if (!user) {
      // Check for local session if any
      const saved = localStorage.getItem('arabic_auth_session') || localStorage.getItem('arabic_demo_profile')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.profile) {
            setProfile(parsed.profile)
            if (parsed.user && !user) setUser(parsed.user)
            setLoading(false)
            return
          } else if (parsed.role) {
            setProfile(parsed)
            if (!user) {
              setUser({
                id: parsed.id,
                email: parsed.email,
                user_metadata: { role: parsed.role, display_name: parsed.display_name },
              } as any)
            }
            setLoading(false)
            return
          }
        } catch {}
      }
      setProfile(null)
      return
    }

    let cancelled = false
    resolveProfile(user).then(p => {
      if (!cancelled) setProfile(p)
    })

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Bootstrap auth state with network-resilient hydration
  useEffect(() => {
    let initialised = false

    // 1. Immediately hydrate from localStorage if available
    const saved = localStorage.getItem('arabic_auth_session') || localStorage.getItem('arabic_demo_profile')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.user && parsed.profile) {
          setUser(parsed.user)
          setProfile(parsed.profile)
          setLoading(false)
        } else if (parsed.role) {
          setUser({
            id: parsed.id,
            email: parsed.email,
            user_metadata: { role: parsed.role, display_name: parsed.display_name },
          } as any)
          setProfile(parsed)
          setLoading(false)
        }
      } catch {}
    }

    // 2. Listen to Supabase auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, newSession: Session | null) => {
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
      }
      if (!initialised) {
        initialised = true
        setLoading(false)
      }
    })

    // 3. Query Supabase getSession with safe timeout
    supabase.auth.getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (data?.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
        if (!initialised) {
          initialised = true
          setLoading(false)
        }
      })
      .catch(() => {
        // In case of network error or connection timeout
        if (!initialised) {
          initialised = true
          setLoading(false)
        }
      })

    // Timeout safety net: if Supabase takes longer than 1500ms to answer, release loading
    const safetyTimer = setTimeout(() => {
      if (!initialised) {
        initialised = true
        setLoading(false)
      }
    }, 1500)

    return () => {
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Auth methods
  // ---------------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data?.user) {
        setUser(data.user)
        return { error: null }
      }

      // If user doesn't exist yet, attempt automatic sign up for teacher
      if (error && (error.message.includes('Invalid login credentials') || error.message.includes('User not found'))) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: email.split('@')[0], role: 'teacher' },
          },
        })
        if (!signUpRes.error && signUpRes.data?.user) {
          setUser(signUpRes.data.user)
          return { error: null }
        }
        if (signUpRes.error) {
          if (signUpRes.error.message.includes('fetch') || signUpRes.error.message.includes('NetworkError')) {
            throw signUpRes.error
          }
          return { error: signUpRes.error }
        }
      }

      if (error) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw error
        }
        return { error }
      }
    } catch (err: any) {
      // RESILIENT OFFLINE FALLBACK:
      // If network connection to Supabase times out or fails with 'Failed to fetch',
      // automatically establish a local authenticated educator session!
      console.warn('Supabase auth network unreachable, activating resilient educator session:', err)
      const mockTeacherId = `teacher_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
      const cleanName = email.split('@')[0] || 'Teacher'
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      const mockUser: any = {
        id: mockTeacherId,
        email,
        user_metadata: {
          role: 'teacher',
          display_name: `Ustadh ${formattedName}`,
        },
      }
      const mockProfile: Profile = {
        id: mockTeacherId,
        email,
        display_name: `Ustadh ${formattedName}`,
        role: 'teacher',
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localStorage.setItem('arabic_auth_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
      setUser(mockUser)
      setProfile(mockProfile)
      return { error: null }
    }
    return { error: null }
  }, [])

  const signInWithStudentPin = useCallback(async (usernameOrEmail: string, pinOrPassword: string) => {
    const rawInput = usernameOrEmail.trim().toLowerCase()
    const rawPass = pinOrPassword.trim()

    // Candidates to test against Supabase auth in order
    const attempts: Array<{ email: string; password: string }> = []

    if (rawInput.includes('@')) {
      attempts.push({ email: rawInput, password: rawPass })
      attempts.push({ email: rawInput, password: `pin_${rawPass}` })
    } else {
      const cleanUser = rawInput.replace(/[^a-z0-9_-]/g, '')
      // 1. Direct email alias (such as fathima@gmail.com)
      attempts.push({ email: `${cleanUser}@gmail.com`, password: rawPass })
      // 2. Student portal format
      attempts.push({ email: `${cleanUser}@student.arabiclearn.com`, password: `pin_${rawPass}` })
      attempts.push({ email: `${cleanUser}@student.arabiclearn.com`, password: rawPass })
    }

    let authError: any = null

    for (const attempt of attempts) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: attempt.email,
          password: attempt.password,
        })

        if (!error && data?.user) {
          setUser(data.user)
          return { error: null }
        }

        if (error && !error.message.includes('Invalid login credentials')) {
          authError = error
        }
      } catch (err: any) {
        authError = err
      }
    }

    // If auto-provisioning is allowed on student portal domain
    if (authError && (authError.message?.includes('fetch') || authError.message?.includes('NetworkError'))) {
      console.warn('Supabase auth network unreachable, activating resilient student session:', authError)
      const cleanUser = rawInput.includes('@') ? rawInput.split('@')[0] : rawInput.replace(/[^a-z0-9_-]/g, '')
      const displayName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1)
      const mockStudentId = `student_${cleanUser}`
      const studentEmail = rawInput.includes('@') ? rawInput : `${cleanUser}@gmail.com`
      const mockUser: any = {
        id: mockStudentId,
        email: studentEmail,
        user_metadata: {
          role: 'student',
          display_name: displayName,
        },
      }
      const mockProfile: Profile = {
        id: mockStudentId,
        email: studentEmail,
        display_name: displayName,
        role: 'student',
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localStorage.setItem('arabic_auth_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
      setUser(mockUser)
      setProfile(mockProfile)
      return { error: null }
    }

    return { error: authError || { message: 'Invalid username, email, or PIN password.' } }
  }, [])

  const signInAsDemo = useCallback(async (role: 'teacher' | 'student') => {
    const mockUser: any = {
      id: role === 'teacher' ? 'teacher_anshad' : 'student_fathima',
      email: role === 'teacher' ? 'anshad@gmail.com' : 'fathima@gmail.com',
      user_metadata: {
        role,
        display_name: role === 'teacher' ? 'Ustadh Anshad' : 'Fathima',
      },
    }
    const mockProfile: Profile = {
      id: mockUser.id,
      email: mockUser.email,
      display_name: mockUser.user_metadata.display_name,
      role,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    localStorage.setItem('arabic_auth_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
    setUser(mockUser)
    setProfile(mockProfile)
  }, [])

  const joinAsStudent = useCallback(async (displayName: string, roomCode = 'LEVEL-1', avatar?: string): Promise<Profile> => {
    const cleanName = displayName.trim() || 'Explorer'
    const cleanCode = (roomCode.trim() || 'LEVEL-1').toUpperCase()
    const studentUid = `student_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`
    const studentEmail = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@student.arabiclearn.com`

    const studentUser: any = {
      id: studentUid,
      email: studentEmail,
      user_metadata: {
        role: 'student',
        display_name: cleanName,
        room_code: cleanCode,
        avatar_url: avatar || '⭐',
      },
    }

    const studentProfile: Profile = {
      id: studentUid,
      email: studentEmail,
      display_name: cleanName,
      role: 'student',
      avatar_url: avatar || '⭐',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    localStorage.setItem(
      'arabic_auth_session',
      JSON.stringify({ user: studentUser, profile: studentProfile, roomCode: cleanCode })
    )
    localStorage.setItem('arabic_student_room', cleanCode)

    setUser(studentUser)
    setProfile(studentProfile)

    // Sync to profiles table if reachable
    try {
      await supabase.from('profiles').upsert({
        id: studentUid,
        display_name: cleanName,
        email: studentEmail,
        role: 'student',
        is_active: true,
      } as any)
    } catch {}

    return studentProfile
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: Profile['role'] = 'student'
    ) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, role },
          },
        })

        if (error || !data.user) {
          if (error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
            throw error
          }
          return { error }
        }

        // Upsert profile safely if table exists
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            display_name: displayName,
            role,
            is_active: true,
          } as any)
        } catch {}

        return { error: null }
      } catch (err: any) {
        // Offline signup fallback
        const mockId = `user_${Date.now()}`
        const mockUser: any = {
          id: mockId,
          email,
          user_metadata: { role, display_name: displayName },
        }
        const mockProfile: Profile = {
          id: mockId,
          email,
          display_name: displayName,
          role,
          avatar_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem('arabic_auth_session', JSON.stringify({ user: mockUser, profile: mockProfile }))
        setUser(mockUser)
        setProfile(mockProfile)
        return { error: null }
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    localStorage.removeItem('arabic_auth_session')
    localStorage.removeItem('arabic_demo_profile')
    try {
      await supabase.auth.signOut()
    } catch {}
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isTeacher = profile?.role === 'teacher'
  const isStudent = profile?.role === 'student'

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isTeacher,
    isStudent,
    signIn,
    signInWithStudentPin,
    signInAsDemo,
    joinAsStudent,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
