-- ============================================================================
-- available_slotsのUPDATEポリシーを修正
-- ============================================================================
-- 問題: company_userとemployeeロールがスロットをUPDATEできない
-- 　　　→ 予約時にstatusを'booked'に更新できず、楽観的ロックが失敗
-- 解決: 法人ユーザー（company_user, employee）が予約可能な枠をUPDATEできるポリシーを追加

-- 法人ユーザーが予約可能な空き枠を更新可能にする
CREATE POLICY "法人ユーザーは予約可能な空き枠を更新可能"
  ON public.available_slots FOR UPDATE
  USING (
    -- 認証済みユーザーで、かつ以下のいずれかの条件を満たす
    auth.uid() IS NOT NULL AND (
      -- 1. 管理者
      EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
      )
      -- 2. 全法人公開の枠（company_id IS NULL）
      OR company_id IS NULL
      -- 3. 自社専用の枠
      OR company_id IN (
        SELECT company_id FROM public.users
        WHERE id = auth.uid()
        AND (role = 'company_user' OR role = 'employee')
      )
    )
  );

COMMENT ON POLICY "法人ユーザーは予約可能な空き枠を更新可能" ON public.available_slots
IS '法人担当者と整体利用者が予約時にスロットのstatusを更新できるようにする';
