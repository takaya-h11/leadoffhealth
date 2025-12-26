-- ============================================================================
-- employee_name の NOT NULL 制約を削除
-- ============================================================================
-- エラー: null value in column "employee_name" violates not-null constraint
-- 解決策: employee_name と employee_id を NULL 許可に変更
-- ============================================================================

-- employee_name の NOT NULL 制約を削除
ALTER TABLE public.appointments
  ALTER COLUMN employee_name DROP NOT NULL;

-- employee_id の NOT NULL 制約も削除（念のため）
ALTER TABLE public.appointments
  ALTER COLUMN employee_id DROP NOT NULL;

-- 確認
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN ('employee_name', 'employee_id', 'user_id')
ORDER BY column_name;

-- 期待される結果:
-- employee_name | YES | text
-- employee_id   | YES | text
-- user_id       | YES | uuid

SELECT '✅ employee_name の制約を削除しました' as status;
