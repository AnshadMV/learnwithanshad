-- Migration: 20261029000001_seed_credentials.sql
-- Direct credential provisioning for Supabase auth.users and public.profiles
-- Enables instant teacher & student login with email/password

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_teacher_id UUID := 'a1111111-1111-1111-1111-111111111111';
  v_student_id UUID := 'b2222222-2222-2222-2222-222222222222';
  v_teacher_email TEXT := 'teacher@school.edu';
  v_student_email TEXT := 'zaid@student.arabiclearn.local';
  v_teacher_pw TEXT := 'teacher123';
  v_student_pw TEXT := 'pin_1234';
BEGIN
  -- 1. Insert or update Educator in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_teacher_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      v_teacher_id,
      '00000000-0000-0000-0000-000000000000',
      v_teacher_email,
      crypt(v_teacher_pw, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"teacher","display_name":"Ustadhah Sarah"}'::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt(v_teacher_pw, gen_salt('bf')),
        email_confirmed_at = NOW(),
        raw_user_meta_data = '{"role":"teacher","display_name":"Ustadhah Sarah"}'::jsonb
    WHERE email = v_teacher_email;
  END IF;

  -- 2. Insert or update Student in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_student_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      v_student_id,
      '00000000-0000-0000-0000-000000000000',
      v_student_email,
      crypt(v_student_pw, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"student","display_name":"Zaid Explorer"}'::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt(v_student_pw, gen_salt('bf')),
        email_confirmed_at = NOW(),
        raw_user_meta_data = '{"role":"student","display_name":"Zaid Explorer"}'::jsonb
    WHERE email = v_student_email;
  END IF;

  -- 3. Upsert profiles in public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES
  (
    (SELECT id FROM auth.users WHERE email = v_teacher_email),
    v_teacher_email,
    'Ustadhah Sarah',
    'teacher',
    true,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = v_student_email),
    v_student_email,
    'Zaid Explorer',
    'student',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

END $$;
