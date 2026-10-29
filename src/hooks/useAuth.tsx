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
      // Check for local demo profile session if any
      const savedDemo = localStorage.getItem('arabic_demo_profile')
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo)
          setProfile(parsed)
          setLoading(false)
          return
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

  // Bootstrap auth state
  useEffect(() => {
    let initialised = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, newSession: Session | null) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (!initialised) {
        initialised = true
        setLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (!initialised) {
        initialised = true
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ---------------------------------------------------------------------------
  // Auth methods
  // ---------------------------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // If user doesn't exist yet, attempt automatic sign up for teacher
      if (error.message.includes('Invalid login credentials') || error.message.includes('User not found')) {
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: email.split('@')[0], role: 'teacher' },
          },
        })
        if (!signUpRes.error) {
          return { error: null }
        }
      }
    }
    return { error }
  }, [])

  const signInWithStudentPin = useCallback(async (username: string, pin: string) => {
    const cleanUser = username.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    const studentEmail = `${cleanUser}@student.arabiclearn.local`
    const password = `pin_${pin}`

    // 1. Try standard sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password,
    })

    // 2. Auto-provision student if not already present
    if (error && (error.message.includes('Invalid login credentials') || error.message.includes('User not found'))) {
      const displayName = cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1)
      const signUpRes = await supabase.auth.signUp({
        email: studentEmail,
        password,
        options: {
          data: { display_name: displayName, role: 'student' },
        },
      })
      if (!signUpRes.error) {
        return { error: null }
      }
    }

    return { error }
  }, [])

  const signInAsDemo = useCallback(async (role: 'teacher' | 'student') => {
    const mockUser: any = {
      id: `demo_${role}_${Date.now()}`,
      email: `demo_${role}@arabiclearn.local`,
      user_metadata: {
        role,
        display_name: role === 'teacher' ? 'Ustadhah Sarah (Demo)' : 'Zaid Explorer (Demo)',
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

    localStorage.setItem('arabic_demo_profile', JSON.stringify(mockProfile))
    setUser(mockUser)
    setProfile(mockProfile)
  }, [])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: Profile['role'] = 'student'
    ) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role },
        },
      })

      if (error || !data.user) return { error }

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
    },
    []
  )

  const signOut = useCallback(async () => {
    localStorage.removeItem('arabic_demo_profile')
    await supabase.auth.signOut().catch(() => {})
    setUser(null)
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
