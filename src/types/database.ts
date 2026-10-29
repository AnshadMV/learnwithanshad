// Database types — auto-generated shape matching Supabase schema
// Run: npx supabase gen types typescript --project-id omrddkzpwchbfkvtzvos > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string
          role: 'teacher' | 'student'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name: string
          role: 'teacher' | 'student'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string
          role?: 'teacher' | 'student'
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      arabic_letters: {
        Row: {
          id: string
          letter: string
          name_arabic: string
          name_english: string
          transliteration: string
          order_index: number
          connects_following: boolean
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          letter: string
          name_arabic: string
          name_english: string
          transliteration: string
          order_index: number
          connects_following: boolean
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          letter?: string
          name_arabic?: string
          name_english?: string
          transliteration?: string
          order_index?: number
          connects_following?: boolean
          audio_url?: string | null
        }
      }
      letter_forms: {
        Row: {
          id: string
          letter_id: string
          form_type: 'isolated' | 'initial' | 'medial' | 'final'
          character: string
          example_word: string
          example_word_meaning: string
          created_at: string
        }
        Insert: {
          id?: string
          letter_id: string
          form_type: 'isolated' | 'initial' | 'medial' | 'final'
          character: string
          example_word: string
          example_word_meaning: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['letter_forms']['Insert']>
      }
      letter_examples: {
        Row: {
          id: string
          letter_id: string
          arabic_word: string
          transliteration: string
          english_meaning: string
          image_url: string | null
          audio_url: string | null
          letter_position: 'beginning' | 'middle' | 'end'
          child_explanation: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          letter_id: string
          arabic_word: string
          transliteration: string
          english_meaning: string
          image_url?: string | null
          audio_url?: string | null
          letter_position: 'beginning' | 'middle' | 'end'
          child_explanation?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['letter_examples']['Insert']>
      }
      games: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          category: string
          difficulty: 'easy' | 'medium' | 'hard'
          min_age: number
          icon: string
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['games']['Row']>
        Update: Partial<Database['public']['Tables']['games']['Row']>
      }
      classrooms: {
        Row: {
          id: string
          teacher_id: string
          name: string
          description: string | null
          invite_code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['classrooms']['Row']>
        Update: Partial<Database['public']['Tables']['classrooms']['Row']>
      }
      classroom_students: {
        Row: {
          id: string
          classroom_id: string
          student_id: string
          joined_at: string
        }
        Insert: Partial<Database['public']['Tables']['classroom_students']['Row']>
        Update: Partial<Database['public']['Tables']['classroom_students']['Row']>
      }
      student_letter_progress: {
        Row: {
          id: string
          student_id: string
          letter_id: string
          mastery_level: number
          attempts: number
          correct: number
          last_practiced_at: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['student_letter_progress']['Row']>
        Update: Partial<Database['public']['Tables']['student_letter_progress']['Row']>
      }
      game_sessions: {
        Row: {
          id: string
          student_id: string
          game_slug: string
          letter_id: string | null
          started_at: string
          completed_at: string | null
          score: number
          questions_total: number
          questions_correct: number
          accuracy: number
          duration_seconds: number | null
          status: 'in_progress' | 'completed' | 'abandoned'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['game_sessions']['Row']>
        Update: Partial<Database['public']['Tables']['game_sessions']['Row']>
      }
      student_achievements: {
        Row: {
          id: string
          student_id: string
          achievement_key: string
          earned_at: string
          metadata: Json | null
        }
        Insert: Partial<Database['public']['Tables']['student_achievements']['Row']>
        Update: Partial<Database['public']['Tables']['student_achievements']['Row']>
      }
      student_activity_events: {
        Row: {
          id: string
          student_id: string
          event_type: string
          game_slug: string | null
          letter_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['student_activity_events']['Row']>
        Update: Partial<Database['public']['Tables']['student_activity_events']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'teacher' | 'student'
      form_type: 'isolated' | 'initial' | 'medial' | 'final'
      letter_position: 'beginning' | 'middle' | 'end'
    }
  }
}
