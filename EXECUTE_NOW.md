# ⚡ 今すぐ実行: マイグレーション手順

**確認済み**: `company_id` カラムが存在しないため、マイグレーションが必要です。

---

## 🚀 実行手順（15分で完了）

### ステップ1: Supabase SQL Editorを開く

以下のURLにアクセス:
```
https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
```

---

### ステップ2: マイグレーション1を実行

**New query** をクリックして、以下のSQLを実行してください:

#### 📋 コピーして実行: マイグレーション1

<details>
<summary>クリックしてSQLを表示</summary>

```sql
-- ============================================================================
-- 予約フロー再設計マイグレーション
-- ============================================================================

-- 1. users テーブルのコメント更新
COMMENT ON COLUMN public.users.role IS 'admin: 管理者, therapist: 整体師, company_user: 整体利用者（個別アカウント）';

-- 2. appointments テーブルの変更
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.appointments.user_id IS '予約した利用者のID（company_userロールのユーザー）';
COMMENT ON COLUMN public.appointments.requested_by IS '非推奨: 予約を申し込んだユーザー（今後はuser_idを使用）';
COMMENT ON COLUMN public.appointments.employee_name IS '非推奨: 今後はusers.full_nameを参照';
COMMENT ON COLUMN public.appointments.employee_id IS '非推奨: 今後はusers.idを参照';

ALTER TABLE public.appointments
  ALTER COLUMN status SET DEFAULT 'approved';

COMMENT ON COLUMN public.appointments.status IS 'approved: 予約確定, cancelled: キャンセル, completed: 施術完了（pending/rejectedは廃止）';
COMMENT ON COLUMN public.appointments.rejected_reason IS '非推奨: 拒否機能廃止のため使用しない';

-- 3. available_slots のステータス更新
COMMENT ON COLUMN public.available_slots.status IS 'available: 予約可能, booked: 予約確定, cancelled: キャンセル済み（pendingは廃止）';

-- 4. 通知タイプの更新
COMMENT ON COLUMN public.notifications.type IS 'appointment_approved: 予約確定, appointment_cancelled: 予約キャンセル, reminder: リマインド（appointment_requested/rejectedは廃止）';

-- 5. トリガー関数: 予約の自動承認
CREATE OR REPLACE FUNCTION public.auto_approve_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- 予約作成時に自動的に approved に設定
  NEW.status := 'approved';

  -- スロットを booked に変更
  UPDATE public.available_slots
  SET status = 'booked'
  WHERE id = NEW.slot_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガー関数: キャンセル時にスロットを解放
CREATE OR REPLACE FUNCTION public.release_slot_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- キャンセル時にスロットを available に戻す
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE public.available_slots
    SET status = 'available'
    WHERE id = NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. トリガーの作成
DROP TRIGGER IF EXISTS auto_approve_appointment_trigger ON public.appointments;
CREATE TRIGGER auto_approve_appointment_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_appointment();

DROP TRIGGER IF EXISTS release_slot_on_cancel_trigger ON public.appointments;
CREATE TRIGGER release_slot_on_cancel_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION public.release_slot_on_cancel();

-- 8. カレンダー用ビュー（利用者向け）
CREATE OR REPLACE VIEW public.calendar_slots_for_users AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  t.id as therapist_id,
  u_therapist.full_name as therapist_name,
  m.name as service_menu_name,
  m.duration_minutes,
  -- 自社の予約のみ法人名と利用者名を表示
  CASE
    WHEN a.id IS NOT NULL AND a.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
      THEN c.name
    WHEN a.id IS NOT NULL
      THEN '予約済み'
    ELSE NULL
  END as company_name,
  CASE
    WHEN a.id IS NOT NULL AND a.company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
      THEN u_customer.full_name
    ELSE NULL
  END as user_name
FROM public.available_slots s
INNER JOIN public.therapists t ON s.therapist_id = t.id
INNER JOIN public.users u_therapist ON t.user_id = u_therapist.id
LEFT JOIN public.service_menus m ON s.service_menu_id = m.id
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed')
LEFT JOIN public.companies c ON a.company_id = c.id
LEFT JOIN public.users u_customer ON a.user_id = u_customer.id;

-- 9. カレンダー用ビュー（スタッフ向け）
CREATE OR REPLACE VIEW public.calendar_slots_for_staff AS
SELECT
  s.id as slot_id,
  s.start_time,
  s.end_time,
  s.status,
  t.id as therapist_id,
  u_therapist.full_name as therapist_name,
  m.name as service_menu_name,
  m.duration_minutes,
  c.name as company_name,
  u_customer.full_name as user_name,
  a.symptoms,
  a.notes
FROM public.available_slots s
INNER JOIN public.therapists t ON s.therapist_id = t.id
INNER JOIN public.users u_therapist ON t.user_id = u_therapist.id
LEFT JOIN public.service_menus m ON s.service_menu_id = m.id
LEFT JOIN public.appointments a ON s.id = a.slot_id AND a.status IN ('approved', 'completed')
LEFT JOIN public.companies c ON a.company_id = c.id
LEFT JOIN public.users u_customer ON a.user_id = u_customer.id;
```

</details>

**✅ 実行後に表示されるべきメッセージ:**
```
Success. No rows returned
```

---

### ステップ3: マイグレーション2を実行

新しいクエリタブで、以下のSQLを実行してください:

#### 📋 コピーして実行: マイグレーション2

<details>
<summary>クリックしてSQLを表示</summary>

```sql
-- ============================================================================
-- 空き枠に法人専用機能を追加
-- ============================================================================

-- 1. available_slots テーブルに company_id を追加
ALTER TABLE public.available_slots
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.available_slots.company_id IS '法人ID（NULLの場合は全法人公開、値がある場合は特定法人専用）';

-- 2. インデックスを追加してパフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_available_slots_company_id ON public.available_slots(company_id);

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
```

</details>

**✅ 実行後に表示されるべきメッセージ:**
```
Success. No rows returned
```

---

### ステップ4: 確認

新しいクエリタブで、以下のSQLを実行して確認:

```sql
-- company_id カラムが追加されたか確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'available_slots' AND column_name = 'company_id';
```

**✅ 期待される結果:**
| column_name | data_type | is_nullable |
|-------------|-----------|-------------|
| company_id | uuid | YES |

---

### ステップ5: 既存データの移行

新しいクエリタブで、以下のSQLを実行:

```sql
-- 既存の予約に user_id を設定（requested_by をコピー）
UPDATE public.appointments
SET user_id = requested_by
WHERE user_id IS NULL
  AND requested_by IS NOT NULL;

-- 結果確認
SELECT
  COUNT(*) as total_appointments,
  COUNT(user_id) as appointments_with_user_id,
  COUNT(*) - COUNT(user_id) as appointments_without_user_id
FROM public.appointments;
```

**✅ 期待される結果:**
- `appointments_without_user_id` が 0 になる

---

## ✅ 完了チェックリスト

- [ ] マイグレーション1を実行（エラーなし）
- [ ] マイグレーション2を実行（エラーなし）
- [ ] `company_id` カラムが存在することを確認
- [ ] 既存データ移行を実行
- [ ] `user_id` が NULL の予約が 0 件

---

## 🐛 エラーが発生した場合

### エラー: `relation "public.appointments" does not exist`
→ テーブル名を確認してください。スキーマは `public` です。

### エラー: `column "company_id" already exists`
→ すでに一部適用済みです。次のステップに進んでください。

### エラー: `permission denied`
→ Supabaseダッシュボードから実行していることを確認してください。

---

## 📞 サポート

問題が解決しない場合:
- `docs/HOW_TO_RUN_MIGRATIONS.md` のトラブルシューティングを確認
- GitHub Issueで報告

---

**最終更新**: 2025年12月9日
