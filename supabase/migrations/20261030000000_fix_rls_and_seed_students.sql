-- Migration: 20261030000000_fix_rls_and_seed_students.sql
-- 1. Fixes missing RLS policies on classroom_students (previously blocked all queries)
-- 2. Fixes recursive RLS policy on profiles table
-- 3. Provides create_student_by_teacher() RPC to bypass email rate limits
-- 4. Seeds Teacher Anshad, Classroom "Level 1", and Students: Fathima & Ahsana

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. FIX RLS POLICIES ON PROFILES
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can read student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public insert profiles for signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profiles" ON public.profiles;

-- Allow reading student profiles (for teachers & classrooms) or own profile
CREATE POLICY "Allow select profiles" ON public.profiles
  FOR SELECT USING (
    role = 'student' OR auth.uid() = id OR auth.uid() IS NOT NULL
  );

-- Allow inserting student profiles (by teachers or signup)
CREATE POLICY "Allow insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    role = 'student' OR auth.uid() = id OR auth.uid() IS NOT NULL
  );

-- Allow updating student profiles
CREATE POLICY "Allow update profiles" ON public.profiles
  FOR UPDATE USING (
    role = 'student' OR auth.uid() = id
  );

-- ---------------------------------------------------------------------------
-- 2. FIX RLS POLICIES ON CLASSROOM_STUDENTS
-- ---------------------------------------------------------------------------
ALTER TABLE public.classroom_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select classroom_students" ON public.classroom_students;
DROP POLICY IF EXISTS "Allow insert classroom_students" ON public.classroom_students;
DROP POLICY IF EXISTS "Allow update classroom_students" ON public.classroom_students;
DROP POLICY IF EXISTS "Allow delete classroom_students" ON public.classroom_students;

CREATE POLICY "Allow select classroom_students" ON public.classroom_students
  FOR SELECT USING (true);

CREATE POLICY "Allow insert classroom_students" ON public.classroom_students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update classroom_students" ON public.classroom_students
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete classroom_students" ON public.classroom_students
  FOR DELETE USING (true);

-- ---------------------------------------------------------------------------
-- 3. FIX RLS POLICIES ON CLASSROOMS
-- ---------------------------------------------------------------------------
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can read their classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can insert classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Teachers can update their classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Allow select classrooms" ON public.classrooms;
DROP POLICY IF EXISTS "Allow insert classrooms" ON public.classrooms;

CREATE POLICY "Allow select classrooms" ON public.classrooms
  FOR SELECT USING (true);

CREATE POLICY "Allow insert classrooms" ON public.classrooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update classrooms" ON public.classrooms
  FOR UPDATE USING (true);

-- ---------------------------------------------------------------------------
-- 4. RPC FUNCTION: create_student_by_teacher
-- Allows educator to create student login credentials instantly without hitting email rate limits
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_student_by_teacher(
  p_display_name TEXT,
  p_username TEXT,
  p_pin TEXT,
  p_classroom_code TEXT DEFAULT 'LEVEL-1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_student_id UUID;
  v_email TEXT;
  v_clean_user TEXT;
  v_class_id UUID;
  v_result JSONB;
BEGIN
  v_clean_user := lower(regexp_replace(p_username, '[^a-zA-Z0-9_-]', '', 'g'));
  v_email := v_clean_user || '@gmail.com';

  -- Find classroom
  SELECT id INTO v_class_id FROM public.classrooms WHERE invite_code = p_classroom_code LIMIT 1;
  IF v_class_id IS NULL THEN
    SELECT id INTO v_class_id FROM public.classrooms ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- Check if user already exists in auth.users
  SELECT id INTO v_student_id FROM auth.users WHERE email = v_email LIMIT 1;
  
  IF v_student_id IS NULL THEN
    v_student_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      created_at, updated_at
    ) VALUES (
      v_student_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(p_pin, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'student', 'display_name', p_display_name),
      false, 'authenticated', 'authenticated', '', '', '', '', NOW(), NOW()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_student_id, v_student_id,
      jsonb_build_object('sub', v_student_id::text, 'email', v_email),
      'email', v_student_id::text, NOW(), NOW(), NOW()
    );
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(p_pin, gen_salt('bf')) WHERE id = v_student_id;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, email, display_name, role, is_active, created_at, updated_at)
  VALUES (v_student_id, v_email, p_display_name, 'student', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    is_active = true,
    updated_at = NOW();

  -- Enroll in classroom
  IF v_class_id IS NOT NULL THEN
    INSERT INTO public.classroom_students (classroom_id, student_id, joined_at)
    VALUES (v_class_id, v_student_id, NOW())
    ON CONFLICT (classroom_id, student_id) DO NOTHING;
  END IF;

  v_result := jsonb_build_object(
    'id', v_student_id,
    'display_name', p_display_name,
    'email', v_email,
    'classroom_id', v_class_id,
    'created_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.create_student_by_teacher(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_student_by_teacher(TEXT, TEXT, TEXT, TEXT) TO anon;

-- ---------------------------------------------------------------------------
-- 5. SEED DATA: Teacher Anshad, Classroom "Level 1", Students: Fathima & Ahsana
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_teacher_id UUID;
  v_class_id   UUID;
  v_fathima_id UUID;
  v_ahsana_id  UUID;
BEGIN
  -- Check Teacher Anshad
  SELECT id INTO v_teacher_id FROM auth.users WHERE email = 'anshad@gmail.com' LIMIT 1;
  IF v_teacher_id IS NULL THEN
    v_teacher_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      created_at, updated_at
    ) VALUES (
      v_teacher_id, '00000000-0000-0000-0000-000000000000',
      'anshad@gmail.com', crypt('Anshadv@123', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"teacher","display_name":"Ustadh Anshad"}'::jsonb,
      false, 'authenticated', 'authenticated', '', '', '', '', NOW(), NOW()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_teacher_id, v_teacher_id,
      json_build_object('sub', v_teacher_id::text, 'email', 'anshad@gmail.com')::jsonb,
      'email', v_teacher_id::text, NOW(), NOW(), NOW()
    );
  END IF;

  -- Upsert Teacher Profile
  INSERT INTO public.profiles (id, email, display_name, role, is_active, created_at, updated_at)
  VALUES (v_teacher_id, 'anshad@gmail.com', 'Ustadh Anshad', 'teacher', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET display_name = 'Ustadh Anshad', role = 'teacher';

  -- Upsert Classroom "Level 1"
  SELECT id INTO v_class_id FROM public.classrooms WHERE invite_code = 'LEVEL-1' LIMIT 1;
  IF v_class_id IS NULL THEN
    v_class_id := gen_random_uuid();
    INSERT INTO public.classrooms (id, teacher_id, name, description, invite_code, is_active, created_at, updated_at)
    VALUES (v_class_id, v_teacher_id, 'Level 1', 'Beginner Arabic Letter Discovery', 'LEVEL-1', true, NOW(), NOW());
  ELSE
    UPDATE public.classrooms SET teacher_id = v_teacher_id, name = 'Level 1' WHERE id = v_class_id;
  END IF;

  -- Seed Student 1: Fathima (fathima@gmail.com / fathima123)
  SELECT id INTO v_fathima_id FROM auth.users WHERE email = 'fathima@gmail.com' LIMIT 1;
  IF v_fathima_id IS NULL THEN
    v_fathima_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      created_at, updated_at
    ) VALUES (
      v_fathima_id, '00000000-0000-0000-0000-000000000000',
      'fathima@gmail.com', crypt('fathima123', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"student","display_name":"Fathima"}'::jsonb,
      false, 'authenticated', 'authenticated', '', '', '', '', NOW(), NOW()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_fathima_id, v_fathima_id,
      json_build_object('sub', v_fathima_id::text, 'email', 'fathima@gmail.com')::jsonb,
      'email', v_fathima_id::text, NOW(), NOW(), NOW()
    );
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, is_active, created_at, updated_at)
  VALUES (v_fathima_id, 'fathima@gmail.com', 'Fathima', 'student', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET display_name = 'Fathima', email = 'fathima@gmail.com', role = 'student';

  INSERT INTO public.classroom_students (classroom_id, student_id, joined_at)
  VALUES (v_class_id, v_fathima_id, NOW())
  ON CONFLICT (classroom_id, student_id) DO NOTHING;

  -- Seed Student 2: Ahsana (ahsana@gmail.com / ahsana123)
  SELECT id INTO v_ahsana_id FROM auth.users WHERE email = 'ahsana@gmail.com' LIMIT 1;
  IF v_ahsana_id IS NULL THEN
    v_ahsana_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      created_at, updated_at
    ) VALUES (
      v_ahsana_id, '00000000-0000-0000-0000-000000000000',
      'ahsana@gmail.com', crypt('ahsana123', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"student","display_name":"Ahsana"}'::jsonb,
      false, 'authenticated', 'authenticated', '', '', '', '', NOW(), NOW()
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      v_ahsana_id, v_ahsana_id,
      json_build_object('sub', v_ahsana_id::text, 'email', 'ahsana@gmail.com')::jsonb,
      'email', v_ahsana_id::text, NOW(), NOW(), NOW()
    );
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, is_active, created_at, updated_at)
  VALUES (v_ahsana_id, 'ahsana@gmail.com', 'Ahsana', 'student', true, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET display_name = 'Ahsana', email = 'ahsana@gmail.com', role = 'student';

  INSERT INTO public.classroom_students (classroom_id, student_id, joined_at)
  VALUES (v_class_id, v_ahsana_id, NOW())
  ON CONFLICT (classroom_id, student_id) DO NOTHING;

END $$;
