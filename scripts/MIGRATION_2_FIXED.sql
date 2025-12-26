-- ============================================================================
-- マイグレーション2: 法人専用空き枠機能（型修正版）
-- ============================================================================
-- 修正: companies.id は BIGINT なので、company_id も BIGINT で作成
-- ============================================================================

-- ステップ1: available_slots.company_id を BIGINT で追加
ALTER TABLE public.available_slots
  ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_available_slots_company_id ON public.available_slots(company_id);

-- ============================================================================
-- RLSポリシーの更新
-- ============================================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "全ユーザーが空き枠を閲覧可能" ON public.available_slots;

-- 新しいポリシー: 管理者と整体師は全ての枠を閲覧可能
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

-- 新しいポリシー: 法人担当者は公開枠と自社専用枠のみ閲覧可能
DROP POLICY IF EXISTS "法人担当者は公開枠と自社専用枠を閲覧可能" ON public.available_slots;
CREATE POLICY "法人担当者は公開枠と自社専用枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- 全法人公開の枠（company_id が NULL）
      company_id IS NULL
      -- OR 自社専用の枠
      OR company_id IN (
        SELECT company_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- 完了メッセージ
SELECT '✅ マイグレーション2完了！（bigint版）' as status;
