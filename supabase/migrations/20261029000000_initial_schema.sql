-- Arabic Learning Adventure Database Schema
-- Includes RLS policies, tables, realtime publications, and triggers.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Arabic Letters Table
CREATE TABLE IF NOT EXISTS public.arabic_letters (
  id TEXT PRIMARY KEY,
  letter TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  name_english TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  order_index INTEGER NOT NULL UNIQUE,
  connects_following BOOLEAN NOT NULL DEFAULT true,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Letter Forms Table
CREATE TABLE IF NOT EXISTS public.letter_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_id TEXT NOT NULL REFERENCES public.arabic_letters(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('isolated', 'initial', 'medial', 'final')),
  character TEXT NOT NULL,
  example_word TEXT NOT NULL,
  example_word_meaning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Letter Examples Table (840 distinct records)
CREATE TABLE IF NOT EXISTS public.letter_examples (
  id TEXT PRIMARY KEY,
  letter_id TEXT NOT NULL REFERENCES public.arabic_letters(id) ON DELETE CASCADE,
  arabic_word TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  english_meaning TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  letter_position TEXT NOT NULL CHECK (letter_position IN ('beginning', 'middle', 'end')),
  child_explanation TEXT,
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Classrooms Table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Classroom Students Join Table
CREATE TABLE IF NOT EXISTS public.classroom_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

-- 7. Student Letter Progress Table
CREATE TABLE IF NOT EXISTS public.student_letter_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  letter_id TEXT NOT NULL REFERENCES public.arabic_letters(id) ON DELETE CASCADE,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, letter_id)
);

-- 8. Game Sessions & Results Table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  letter_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  questions_total INTEGER NOT NULL DEFAULT 0,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  accuracy INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Student Achievements Table
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(student_id, achievement_key)
);

-- 10. Student Activity Events (for Live Teacher Monitoring)
CREATE TABLE IF NOT EXISTS public.student_activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  game_slug TEXT,
  letter_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arabic_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_letter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_events ENABLE ROW LEVEL SECURITY;

-- Public read policies for learning content
CREATE POLICY "Public read letters" ON public.arabic_letters FOR SELECT USING (true);
CREATE POLICY "Public read letter forms" ON public.letter_forms FOR SELECT USING (true);
CREATE POLICY "Public read letter examples" ON public.letter_examples FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can read student profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public insert profiles for signup" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Classrooms policies
CREATE POLICY "Teachers can read their classrooms" ON public.classrooms FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can insert classrooms" ON public.classrooms FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers can update their classrooms" ON public.classrooms FOR UPDATE USING (teacher_id = auth.uid());

-- Student Progress policies
CREATE POLICY "Students can read own progress" ON public.student_letter_progress FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can upsert own progress" ON public.student_letter_progress FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers can view student progress" ON public.student_letter_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Game Sessions policies
CREATE POLICY "Students can manage own sessions" ON public.game_sessions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers can view student sessions" ON public.game_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Realtime publication for Live Learning Monitor
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_activity_events;
