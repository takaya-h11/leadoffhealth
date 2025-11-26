-- Add admin_comments column to treatment_records table
-- This allows administrators to add comments/notes to treatment records

ALTER TABLE public.treatment_records
ADD COLUMN admin_comments TEXT;

COMMENT ON COLUMN public.treatment_records.admin_comments IS '管理者コメント - 管理者が施術記録に対して追加できるコメント';
