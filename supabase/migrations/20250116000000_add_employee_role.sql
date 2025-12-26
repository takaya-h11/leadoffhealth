-- Add employee role to the system
-- This migration adds a new 'employee' role for users who can book appointments for themselves

-- 1. Drop existing role constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add new constraint with 'employee' role
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'therapist', 'company_user', 'employee'));

-- 3. Update appointments RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company appointments" ON public.appointments;
DROP POLICY IF EXISTS "Company users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Company users can update their appointments" ON public.appointments;

-- New policy: Employees can view their own appointments
CREATE POLICY "Employees can view own appointments"
  ON public.appointments FOR SELECT
  USING (
    -- Employee can see their own appointments
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    ))
    OR
    -- Company user can see all appointments from their company
    EXISTS (
      SELECT 1 FROM public.users u1, public.users u2
      WHERE u1.id = auth.uid()
        AND u1.role = 'company_user'
        AND u2.id = appointments.user_id
        AND u1.company_id = u2.company_id
    )
    OR
    -- Therapist and admin can see all appointments
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'therapist')
    )
  );

-- New policy: Employees can create their own appointments
CREATE POLICY "Employees can create own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    -- Employee creating appointment for themselves
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'employee'
      AND company_id = appointments.company_id
    ))
    OR
    -- Admin can create appointments for anyone
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- New policy: Employees can update (cancel) their own appointments
CREATE POLICY "Employees can update own appointments"
  ON public.appointments FOR UPDATE
  USING (
    -- Employee can update their own appointments
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    ))
    OR
    -- Admin and therapist can update any appointment
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'therapist')
    )
  );

-- 4. Update treatment_records RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company treatment records" ON public.treatment_records;

-- New policy: Employees can view their own treatment records
CREATE POLICY "Employees can view own treatment records"
  ON public.treatment_records FOR SELECT
  USING (
    -- Employee can see their own treatment records
    EXISTS (
      SELECT 1 FROM public.appointments a, public.users u
      WHERE a.id = treatment_records.appointment_id
        AND a.user_id = auth.uid()
        AND u.id = auth.uid()
        AND u.role = 'employee'
    )
    OR
    -- Company user can see all treatment records from their company
    EXISTS (
      SELECT 1 FROM public.appointments a, public.users u1, public.users u2
      WHERE a.id = treatment_records.appointment_id
        AND u1.id = auth.uid()
        AND u1.role = 'company_user'
        AND u2.id = a.user_id
        AND u1.company_id = u2.company_id
    )
    OR
    -- Therapist and admin can see all treatment records
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'therapist')
    )
  );

-- 5. Add comment to document the change
COMMENT ON CONSTRAINT users_role_check ON public.users IS
  'Allowed roles: admin (full access), therapist (manage slots & treatments), company_user (view company data), employee (book own appointments)';
