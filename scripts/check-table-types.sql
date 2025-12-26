-- ============================================================================
-- テーブルのデータ型確認
-- ============================================================================

-- companies テーブルの id カラムの型を確認
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name = 'id';

-- users テーブルの id カラムの型を確認
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';

-- available_slots テーブルの therapist_id の型を確認
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'available_slots' AND column_name = 'therapist_id';

-- appointments テーブルの company_id の型を確認
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name = 'company_id';
