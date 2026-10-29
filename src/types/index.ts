// Shared application types

export type UserRole = 'teacher' | 'student'

export interface Profile {
  id: string
  email: string | null
  display_name: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ArabicLetter {
  id: string
  letter: string
  name_arabic: string
  name_english: string
  transliteration: string
  order_index: number
  connects_following: boolean
  audio_url: string | null
  forms: LetterForm[]
  examples?: LetterExample[]
}

export interface LetterForm {
  id: string
  letter_id: string
  form_type: 'isolated' | 'initial' | 'medial' | 'final'
  character: string
  example_word: string
  example_word_meaning: string
}

export interface LetterExample {
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
}

export interface GameDef {
  id: string
  slug: string
  name: string
  description: string
  category: 'recognition' | 'writing' | 'listening' | 'arcade'
  difficulty: 'easy' | 'medium' | 'hard'
  min_age: number
  icon: string
  color: string
  is_active: boolean
}

export interface GameSession {
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
}

export interface GameResult {
  score: number
  questionsTotal: number
  questionsCorrect: number
  accuracy: number
  durationSeconds: number
  stars: number
  passed: boolean
}

export interface StudentProgress {
  letter_id: string
  mastery_level: number
  attempts: number
  correct: number
  completed: boolean
  last_practiced_at: string
}

export interface Achievement {
  key: string
  name: string
  description: string
  icon: string
  color: string
  earned_at?: string
}

export interface Classroom {
  id: string
  teacher_id: string
  name: string
  description: string | null
  invite_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LiveStudentActivity {
  student_id: string
  display_name: string
  avatar_url: string | null
  online: boolean
  last_seen: string
  current_game: string | null
  current_letter: string | null
  current_score: number
  questions_answered: number
  accuracy: number
  session_started: string | null
}
