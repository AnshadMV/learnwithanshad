-- Migration: 20261029000002_reset_and_seed_anshad.sql
-- Fixes "Database error querying schema" by ensuring tokens are empty strings '' instead of NULL.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_teacher_id UUID := gen_random_uuid();
  v_student_id UUID := gen_random_uuid();
  v_class_id   UUID := gen_random_uuid();

  v_teacher_email TEXT := 'anshad@gmail.com';
  v_teacher_pw    TEXT := 'Anshadv@123';

  v_student_email TEXT := 'fathima@gmail.com';
  v_student_pw    TEXT := 'fathima123';
  v_student_name  TEXT := 'Fathima';
BEGIN
  -- 1. Clean previous user activities, progress, classrooms, and profiles
  DELETE FROM public.student_activity_events;
  DELETE FROM public.student_achievements;
  DELETE FROM public.game_sessions;
  DELETE FROM public.student_letter_progress;
  DELETE FROM public.classroom_students;
  DELETE FROM public.classrooms;
  DELETE FROM public.profiles;

  -- 2. Clean previous Auth tables
  DELETE FROM auth.identities;
  DELETE FROM auth.users;

  -- 3. Insert Teacher (Anshad) into auth.users with empty string tokens (avoids Go scan NULL error)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    created_at,
    updated_at
  ) VALUES (
    v_teacher_id,
    '00000000-0000-0000-0000-000000000000',
    v_teacher_email,
    crypt(v_teacher_pw, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"teacher","display_name":"Ustadh Anshad"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    NOW(),
    NOW()
  );

  -- 4. Insert Teacher identity into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_teacher_id,
    v_teacher_id,
    json_build_object('sub', v_teacher_id::text, 'email', v_teacher_email)::jsonb,
    'email',
    v_teacher_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- 5. Insert Teacher profile into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_teacher_id,
    v_teacher_email,
    'Ustadh Anshad',
    'teacher',
    true,
    NOW(),
    NOW()
  );

  -- 6. Insert Classroom "Level 1" owned by Teacher Anshad
  INSERT INTO public.classrooms (
    id,
    teacher_id,
    name,
    description,
    invite_code,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_class_id,
    v_teacher_id,
    'Level 1',
    'Beginner Arabic Letter Discovery',
    'LEVEL-1',
    true,
    NOW(),
    NOW()
  );

  -- 7. Insert Student (Fathima) into auth.users with empty string tokens
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    created_at,
    updated_at
  ) VALUES (
    v_student_id,
    '00000000-0000-0000-0000-000000000000',
    v_student_email,
    crypt(v_student_pw, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"student","display_name":"Fathima"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    NOW(),
    NOW()
  );

  -- 8. Insert Student identity into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_student_id,
    v_student_id,
    json_build_object('sub', v_student_id::text, 'email', v_student_email)::jsonb,
    'email',
    v_student_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- 9. Insert Student profile into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_student_id,
    v_student_email,
    v_student_name,
    'student',
    true,
    NOW(),
    NOW()
  );

  -- 10. Enroll Fathima into "Level 1" classroom
  INSERT INTO public.classroom_students (
    classroom_id,
    student_id,
    joined_at
  ) VALUES (
    v_class_id,
    v_student_id,
    NOW()
  );

END $$;
