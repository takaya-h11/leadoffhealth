-- Create second demo employee user for development
-- Email: employee2@demo.com
-- Password: demo123
-- Role: employee
-- Name: 三郎さん（デモ利用者2）
-- Company ID: 100002

-- Note: The auth.users entry should be created via Supabase Auth signup
-- This migration only creates the public.users record

DO $$
DECLARE
  demo_company_id TEXT := '100002';
  demo_user_id UUID;
BEGIN
  -- Check if company exists
  IF NOT EXISTS (
    SELECT 1 FROM public.companies WHERE id::text = demo_company_id
  ) THEN
    RAISE EXCEPTION 'Company % not found. Please ensure the company exists first.', demo_company_id;
  END IF;

  -- Check if employee2 user already exists in auth.users
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'employee2@demo.com';

  IF demo_user_id IS NOT NULL THEN
    -- User exists in auth.users, create or update public.users record
    INSERT INTO public.users (id, email, full_name, role, company_id, is_active, must_change_password)
    VALUES (
      demo_user_id,
      'employee2@demo.com',
      '三郎さん（デモ利用者2）',
      'employee',
      demo_company_id::uuid,
      true,
      false
    )
    ON CONFLICT (id) DO UPDATE
    SET
      role = 'employee',
      full_name = '三郎さん（デモ利用者2）',
      company_id = demo_company_id::uuid,
      is_active = true,
      must_change_password = false,
      updated_at = NOW();

    RAISE NOTICE 'Demo employee2 user created/updated: % (company: %)', demo_user_id, demo_company_id;
  ELSE
    RAISE NOTICE 'Auth user employee2@demo.com not found. Please create via Supabase Dashboard or signUp() first.';
  END IF;
END $$;

-- Add helpful comment
COMMENT ON TABLE public.users IS 'Users table with roles: admin, therapist, company_user, employee. Demo users: employee@demo.com (次郎さん, company 100001), employee2@demo.com (三郎さん, company 100002)';
