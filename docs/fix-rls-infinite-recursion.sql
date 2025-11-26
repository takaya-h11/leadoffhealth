-- ============================================================================
-- RLS無限再帰エラーの修正
-- ============================================================================
-- Error: infinite recursion detected in policy for relation "users"
-- ============================================================================

-- ============================================================================
-- STEP 1: 既存のusersテーブルのRLSポリシーを確認
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- STEP 2: 既存のポリシーを削除
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Therapists can read all users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;

-- すべてのusersポリシーを削除
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: 新しいRLSポリシーを作成（無限再帰を回避）
-- ============================================================================

-- RLSを一時的に無効化してからポリシーを作成
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- RLSを再度有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ポリシー1: 認証されたユーザーは自分のデータを読める
-- ============================================================================
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- ポリシー2: 認証されたユーザーは自分のデータを更新できる
-- ============================================================================
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ポリシー3: 管理者は全ユーザーを読める
-- ============================================================================
CREATE POLICY "users_select_admin"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- ポリシー4: 管理者は全ユーザーを更新できる
-- ============================================================================
CREATE POLICY "users_update_admin"
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- ポリシー5: 管理者はユーザーを追加できる
-- ============================================================================
CREATE POLICY "users_insert_admin"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- ポリシー6: 管理者はユーザーを削除できる
-- ============================================================================
CREATE POLICY "users_delete_admin"
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- ポリシー7: 整体師は全ユーザーを読める
-- ============================================================================
CREATE POLICY "users_select_therapist"
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'therapist'
  )
);

-- ============================================================================
-- STEP 4: 確認
-- ============================================================================

-- 新しいポリシーを確認
SELECT
  policyname,
  cmd,
  roles,
  CASE
    WHEN LENGTH(qual::text) > 50 THEN LEFT(qual::text, 50) || '...'
    ELSE qual::text
  END as using_clause
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- RLSが有効か確認
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- ============================================================================
-- 完了！
-- ============================================================================
-- これでログイン時のRLSエラーが解消されるはずです
-- ============================================================================
