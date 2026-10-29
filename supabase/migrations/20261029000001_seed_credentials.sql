-- Migration: 20261029000001_seed_credentials.sql
-- Direct credential provisioning for Supabase auth.users, auth.identities, and public.profiles
-- Uses UUID type matching across auth.users and auth.identities

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
  -- 1. Remove previous partial entries cleanly by UUID
  DELETE FROM auth.identities 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN (v_teacher_email, v_student_email)
  ) OR user_id IN (v_teacher_id, v_student_id);

  DELETE FROM public.profiles 
  WHERE id IN (v_teacher_id, v_student_id) 
     OR email IN (v_teacher_email, v_student_email);

  DELETE FROM auth.users 
  WHERE email IN (v_teacher_email, v_student_email) 
     OR id IN (v_teacher_id, v_student_id);

  -- 2. Insert Teacher into auth.users
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
    created_at,
    updated_at
  ) VALUES (
    v_teacher_id,
    '00000000-0000-0000-0000-000000000000',
    v_teacher_email,
    crypt(v_teacher_pw, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"teacher","display_name":"Ustadhah Sarah"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  -- 3. Insert Teacher into auth.identities (id is UUID in Supabase)
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

  -- 4. Insert Student into auth.users
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
    created_at,
    updated_at
  ) VALUES (
    v_student_id,
    '00000000-0000-0000-0000-000000000000',
    v_student_email,
    crypt(v_student_pw, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"student","display_name":"Zaid Explorer"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  -- 5. Insert Student into auth.identities
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

  -- 6. Insert Profiles in public.profiles
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
    v_teacher_id,
    v_teacher_email,
    'Ustadhah Sarah',
    'teacher',
    true,
    NOW(),
    NOW()
  ),
  (
    v_student_id,
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
