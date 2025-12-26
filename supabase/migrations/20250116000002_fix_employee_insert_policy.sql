-- Fix employee INSERT policy for appointments
-- The previous policy incorrectly referenced appointments.company_id during INSERT
-- which doesn't exist yet, causing all employee bookings to fail

-- Drop the broken policy
DROP POLICY IF EXISTS "Employees can create own appointments" ON public.appointments;

-- Recreate with correct logic
CREATE POLICY "Employees can create own appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    -- Employee creating appointment for themselves
    -- Check that the user is an employee and the company_id matches their company
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'employee'
      AND company_id = (SELECT company_id FROM public.users WHERE id = user_id)
    ))
    OR
    -- Admin can create appointments for anyone
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add helpful comment
COMMENT ON POLICY "Employees can create own appointments" ON public.appointments IS
  'Employees can create appointments for themselves within their company. Admins can create appointments for anyone.';
