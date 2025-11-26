-- ============================================================================
-- 不足しているRLSポリシーを追加
-- ============================================================================

-- Therapists: 全員が閲覧可能、管理者は全て可能
CREATE POLICY "全ユーザーが整体師を閲覧可能"
  ON public.therapists FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は整体師を作成可能"
  ON public.therapists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は整体師を更新可能"
  ON public.therapists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Service Menus: 全員が閲覧可能、管理者は全て可能
ALTER TABLE public.service_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全ユーザーが施術メニューを閲覧可能"
  ON public.service_menus FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は施術メニューを作成可能"
  ON public.service_menus FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は施術メニューを更新可能"
  ON public.service_menus FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は施術メニューを削除可能"
  ON public.service_menus FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Symptoms: 全員が閲覧可能、管理者は全て可能
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全ユーザーが症状を閲覧可能"
  ON public.symptoms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は症状を作成可能"
  ON public.symptoms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "管理者は症状を更新可能"
  ON public.symptoms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Available Slots: 管理者は全て、整体師は自分の枠、全員が閲覧可能
ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "全ユーザーが空き枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "管理者は空き枠を全て操作可能"
  ON public.available_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "整体師は自分の空き枠を作成可能"
  ON public.available_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.therapists t ON u.id = t.user_id
      WHERE u.id = auth.uid()
      AND t.id = therapist_id
    )
  );

CREATE POLICY "整体師は自分の空き枠を更新可能"
  ON public.available_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.therapists t ON u.id = t.user_id
      WHERE u.id = auth.uid()
      AND t.id = therapist_id
    )
  );

CREATE POLICY "整体師は自分の空き枠を削除可能"
  ON public.available_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.therapists t ON u.id = t.user_id
      WHERE u.id = auth.uid()
      AND t.id = therapist_id
    )
  );

-- Appointments: 管理者は全て、整体師は全て、法人担当者は自社のみ
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理者は予約を全て操作可能"
  ON public.appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "整体師は予約を全て閲覧・更新可能"
  ON public.appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'therapist'
    )
  );

CREATE POLICY "法人担当者は自社の予約を操作可能"
  ON public.appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.company_id = appointments.company_id
    )
  );

-- Treatment Records: 管理者は全て、整体師は全て、法人担当者は自社のみ閲覧
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理者は施術記録を全て操作可能"
  ON public.treatment_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "整体師は施術記録を全て操作可能"
  ON public.treatment_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'therapist'
    )
  );

CREATE POLICY "法人担当者は自社の施術記録を閲覧可能"
  ON public.treatment_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.appointments a ON a.company_id = u.company_id
      WHERE u.id = auth.uid()
      AND a.id = treatment_records.appointment_id
    )
  );

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の通知を閲覧可能"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "ユーザーは自分の通知を更新可能"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "システムは通知を作成可能"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 管理者用の追加ポリシー
CREATE POLICY "管理者は全ユーザー情報を閲覧可能"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "管理者はユーザーを作成可能"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "管理者はユーザーを更新可能"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- 整体師が法人を閲覧可能
CREATE POLICY "整体師は法人を閲覧可能"
  ON public.companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'therapist'
    )
  );

-- 法人担当者が自社を閲覧可能
CREATE POLICY "法人担当者は自社を閲覧可能"
  ON public.companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.company_id = companies.id
    )
  );
