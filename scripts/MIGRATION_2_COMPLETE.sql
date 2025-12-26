-- ============================================================================
-- マイグレーション2: 法人専用空き枠機能（完全版）
-- ============================================================================
-- このファイルを Supabase SQL Editor で実行してください
-- マイグレーション1を実行してから、このファイルを実行してください
-- ============================================================================

-- ステップ1: available_slots.company_id カラムを追加
-- 注意: companies.id は BIGINT なので、company_id も BIGINT で作成
ALTER TABLE public.available_slots
  ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;

-- ステップ2: インデックスを作成
CREATE INDEX IF NOT EXISTS idx_available_slots_company_id ON public.available_slots(company_id);

-- ステップ3: 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "全ユーザーが空き枠を閲覧可能" ON public.available_slots;

-- ステップ4: 新しいRLSポリシーを作成（管理者と整体師）
DROP POLICY IF EXISTS "管理者と整体師は全枠を閲覧可能" ON public.available_slots;
CREATE POLICY "管理者と整体師は全枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'therapist')
    )
  );

-- ステップ5: 新しいRLSポリシーを作成（法人担当者）
DROP POLICY IF EXISTS "法人担当者は公開枠と自社専用枠を閲覧可能" ON public.available_slots;
CREATE POLICY "法人担当者は公開枠と自社専用枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      company_id IS NULL
      OR company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- 完了メッセージ
SELECT '✅ マイグレーション2完了！' as status;
