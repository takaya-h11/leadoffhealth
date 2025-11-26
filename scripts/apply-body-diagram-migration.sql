-- ============================================================
-- Body Diagram Migration
-- ============================================================
-- This script adds body_diagram_data and body_diagram_image_url
-- columns to the treatment_records table.
--
-- How to apply:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project (jtdaguehanvqozhhfxru)
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" or press Ctrl+Enter
-- ============================================================

-- Add body diagram columns
ALTER TABLE public.treatment_records
ADD COLUMN IF NOT EXISTS body_diagram_data JSONB,
ADD COLUMN IF NOT EXISTS body_diagram_image_url TEXT;

-- Add comments
COMMENT ON COLUMN public.treatment_records.body_diagram_data IS 'JSON data containing drawing strokes, annotations, pins, and view information for body diagrams';
COMMENT ON COLUMN public.treatment_records.body_diagram_image_url IS 'URL to the exported PNG image of the body diagram stored in Supabase Storage';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_treatment_records_has_diagram
ON public.treatment_records ((body_diagram_data IS NOT NULL))
WHERE body_diagram_data IS NOT NULL;

-- Verify the columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'treatment_records'
  AND column_name IN ('body_diagram_data', 'body_diagram_image_url');

-- Success message (will appear in results)
SELECT
  '✅ Migration completed successfully!' as status,
  'body_diagram_data and body_diagram_image_url columns have been added' as message;
