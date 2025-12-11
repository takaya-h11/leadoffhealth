-- ============================================================================
-- 空き枠に法人専用機能を追加
-- ============================================================================

-- 1. available_slots テーブルに company_id を追加
-- 注意: companies.id は BIGINT なので、company_id も BIGINT で作成
ALTER TABLE public.available_slots
ADD COLUMN company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.available_slots.company_id IS '法人ID（NULLの場合は全法人公開、値がある場合は特定法人専用）';

-- 2. インデックスを追加してパフォーマンス向上
CREATE INDEX idx_available_slots_company_id ON public.available_slots(company_id);

-- 3. RLSポリシーの更新

-- 既存の「全ユーザーが空き枠を閲覧可能」ポリシーを削除
DROP POLICY IF EXISTS "全ユーザーが空き枠を閲覧可能" ON public.available_slots;

-- 新しいポリシー: 管理者と整体師は全ての枠を閲覧可能
CREATE POLICY "管理者と整体師は全枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'therapist')
    )
  );

-- 新しいポリシー: 法人担当者は公開枠（company_id IS NULL）と自社専用枠のみ閲覧可能
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

-- 注意: 既存のINSERT, UPDATE, DELETEポリシーはそのまま残す
-- （管理者は全操作可能、整体師は自分の枠を作成・編集・削除可能）
