-- Fix slot_id unique constraint to allow re-booking cancelled slots
-- Drop the existing UNIQUE constraint on slot_id
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_slot_id_key;

-- Create a partial unique index that only applies to non-cancelled appointments
-- This allows multiple cancelled appointments for the same slot, but prevents duplicate active appointments
CREATE UNIQUE INDEX appointments_slot_id_active_unique
ON public.appointments(slot_id)
WHERE status != 'cancelled';
