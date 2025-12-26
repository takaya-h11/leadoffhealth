-- ============================================================================
-- appointmentsテーブルのSELECTポリシーを修正
-- ============================================================================
-- 問題: 法人担当者が他社の予約を全く見れないため、calendar_slots_for_usersビューで
--       他社の予約がnullになる（JOINが成立しない）
-- 原因: "法人担当者は自社の予約を操作可能" ポリシーがFOR ALLになっているため、
--       SELECTも自社のみに制限されている
-- 解決: SELECTは全員が全予約を閲覧可能にし、INSERT/UPDATE/DELETEは自社のみに制限
-- ============================================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "法人担当者は自社の予約を操作可能" ON public.appointments;

-- 新しいポリシーを作成

-- 1. SELECT: 全員が全予約を閲覧可能（ビューで詳細情報をフィルタリング）
CREATE POLICY "全ユーザーが予約を閲覧可能"
  ON public.appointments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. INSERT: 法人担当者は自社の予約のみ作成可能
CREATE POLICY "法人担当者は自社の予約を作成可能"
  ON public.appointments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'company_user' OR users.role = 'employee')
      AND users.company_id = appointments.company_id
    )
  );

-- 3. UPDATE: 法人担当者は自社の予約のみ更新可能
CREATE POLICY "法人担当者は自社の予約を更新可能"
  ON public.appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'company_user' OR users.role = 'employee')
      AND users.company_id = appointments.company_id
    )
  );

-- 4. DELETE: 法人担当者は自社の予約のみ削除可能
CREATE POLICY "法人担当者は自社の予約を削除可能"
  ON public.appointments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'company_user' OR users.role = 'employee')
      AND users.company_id = appointments.company_id
    )
  );

-- 注: 管理者と整体師のFOR ALLポリシーはそのまま維持される
-- これにより、以下のようになる:
--   - 管理者: 全ての操作が可能（既存ポリシー）
--   - 整体師: 全ての操作が可能（既存ポリシー）
--   - 法人担当者/employee: 全予約の閲覧可能、自社の予約のみ作成/更新/削除可能（新ポリシー）
--   - calendar_slots_for_usersビュー: 全予約をJOINできるが、詳細情報は自社のみ表示

COMMENT ON POLICY "全ユーザーが予約を閲覧可能" ON public.appointments IS
'全ユーザーが全予約のレコードを閲覧可能。詳細情報のフィルタリングはcalendar_slots_for_usersビューで行う。';

COMMENT ON POLICY "法人担当者は自社の予約を作成可能" ON public.appointments IS
'法人担当者とemployeeは自社の予約のみ作成可能。';

COMMENT ON POLICY "法人担当者は自社の予約を更新可能" ON public.appointments IS
'法人担当者とemployeeは自社の予約のみ更新可能。';

COMMENT ON POLICY "法人担当者は自社の予約を削除可能" ON public.appointments IS
'法人担当者とemployeeは自社の予約のみ削除可能。';
