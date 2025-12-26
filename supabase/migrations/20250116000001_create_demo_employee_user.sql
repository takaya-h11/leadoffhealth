-- Create demo employee user for development
-- Email: employee@demo.com
-- Password: demo123
-- Role: employee
-- Name: 次郎さん（デモ利用者）

-- Note: The auth.users entry should be created via Supabase Auth signup
-- This migration only creates the public.users record

-- First, check if the company exists (using the same company as company_user demo)
DO $$
DECLARE
  demo_company_id UUID;
  demo_user_id UUID;
BEGIN
  -- Get the demo company ID (same as company_user demo)
  SELECT company_id INTO demo_company_id
  FROM public.users
  WHERE email = 'company@demo.com'
  LIMIT 1;

  IF demo_company_id IS NULL THEN
    RAISE EXCEPTION 'Demo company not found. Please ensure company@demo.com user exists first.';
  END IF;

  -- Check if employee user already exists in auth.users
  SELECT id INTO demo_user_id
  FROM auth.users
  WHERE email = 'employee@demo.com';

  IF demo_user_id IS NOT NULL THEN
    -- User exists in auth.users, create or update public.users record
    INSERT INTO public.users (id, email, full_name, role, company_id, is_active, must_change_password)
    VALUES (
      demo_user_id,
      'employee@demo.com',
      '次郎さん（デモ利用者）',
      'employee',
      demo_company_id,
      true,
      false
    )
    ON CONFLICT (id) DO UPDATE
    SET
      role = 'employee',
      full_name = '次郎さん（デモ利用者）',
      company_id = demo_company_id,
      is_active = true,
      must_change_password = false,
      updated_at = NOW();

    RAISE NOTICE 'Demo employee user created/updated: % (company: %)', demo_user_id, demo_company_id;
  ELSE
    RAISE NOTICE 'Auth user employee@demo.com not found. Please create via Supabase Dashboard or signUp() first.';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.users IS 'Users table with roles: admin, therapist, company_user, employee';
