# マイグレーション後のチェックリスト

**実行日**: 2025年12月5日
**マイグレーションファイル**: `20250111000000_redesign_booking_flow.sql`

---

## ✅ 必須確認事項

### 1. データベーススキーマの確認

Supabaseダッシュボード → Database → Tables で確認:

#### appointmentsテーブル
- [ ] `user_id` カラムが存在する（UUID型）
- [ ] `user_id` の外部キー制約が `users(id)` を参照している
- [ ] `status` のデフォルト値が `'approved'` になっている

確認方法:
```sql
-- Supabase SQL Editorで実行
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
  AND column_name IN ('user_id', 'status');

-- 外部キー制約の確認
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'appointments'
  AND kcu.column_name = 'user_id';
```

#### available_slotsテーブル
- [ ] 特に変更なし（確認不要）

---

### 2. ビューの確認

Supabaseダッシュボード → Database → Views で確認:

- [ ] `calendar_slots_for_users` ビューが作成されている
- [ ] `calendar_slots_for_staff` ビューが作成されている

確認方法:
```sql
-- ビューの存在確認
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('calendar_slots_for_users', 'calendar_slots_for_staff');

-- ビューの内容確認（データが取得できるか）
SELECT * FROM calendar_slots_for_users LIMIT 5;
SELECT * FROM calendar_slots_for_staff LIMIT 5;
```

---

### 3. トリガーの確認

確認方法:
```sql
-- トリガーの存在確認
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('auto_approve_appointment_trigger', 'release_slot_on_cancel_trigger');
```

期待される結果:
```
trigger_name                        | event_manipulation | event_object_table
------------------------------------+--------------------+-------------------
auto_approve_appointment_trigger    | INSERT             | appointments
release_slot_on_cancel_trigger      | UPDATE             | appointments
```

---

### 4. 既存データの移行

#### ステップ1: 現状確認

```sql
-- user_id が NULL の予約を確認
SELECT
  COUNT(*) as total_null_user_id,
  COUNT(DISTINCT company_id) as affected_companies
FROM public.appointments
WHERE user_id IS NULL;
```

#### ステップ2: データ移行

**オプション1**: 既存データが本番データの場合（推奨）

```sql
-- requested_by を user_id にコピー
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

**オプション2**: テスト環境の場合

```sql
-- 全ての予約を削除（注意: 本番では実行しないこと！）
TRUNCATE public.appointments CASCADE;

-- 空き枠のステータスをリセット
UPDATE public.available_slots
SET status = 'available'
WHERE status IN ('pending', 'booked');
```

#### ステップ3: データ整合性チェック

```sql
-- 1. user_id が NULL の予約が残っていないか確認
SELECT id, requested_by, employee_name, status
FROM public.appointments
WHERE user_id IS NULL;

-- 2. user_id が存在するが、users テーブルに該当ユーザーがいない予約を確認
SELECT
  a.id,
  a.user_id,
  a.employee_name,
  u.full_name
FROM public.appointments a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.user_id IS NOT NULL
  AND u.id IS NULL;

-- 3. company_id の整合性確認
SELECT
  a.id,
  a.company_id as appointment_company_id,
  u.company_id as user_company_id,
  c1.name as appointment_company,
  c2.name as user_company
FROM public.appointments a
JOIN public.users u ON a.user_id = u.id
LEFT JOIN public.companies c1 ON a.company_id = c1.id
LEFT JOIN public.companies c2 ON u.company_id = c2.id
WHERE a.company_id != u.company_id;
```

---

## 🧪 機能テスト

### テスト1: 予約の即時承認

**手順:**
1. 整体利用者アカウントでログイン
2. カレンダーから空き枠を選択
3. 症状と要望を入力して「申込」

**期待結果:**
- [ ] 予約が即座に作成される
- [ ] 予約のステータスが `'approved'` になっている
- [ ] `available_slots` のステータスが `'booked'` になっている
- [ ] 成功メッセージが「予約が確定しました」と表示される

確認クエリ:
```sql
-- 最新の予約を確認
SELECT
  a.id,
  a.status,
  a.user_id,
  u.full_name,
  s.status as slot_status,
  a.created_at
FROM public.appointments a
JOIN public.users u ON a.user_id = u.id
JOIN public.available_slots s ON a.slot_id = s.id
ORDER BY a.created_at DESC
LIMIT 1;
```

---

### テスト2: トリガーの動作確認（自動承認）

**手順:**
```sql
-- テスト用の空き枠を作成（手動で実行）
INSERT INTO public.available_slots (therapist_id, service_menu_id, start_time, end_time, status)
VALUES (
  (SELECT id FROM public.therapists LIMIT 1),
  (SELECT id FROM public.service_menus LIMIT 1),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '1 hour',
  'available'
);

-- 上記で作成したスロットのIDを確認
SELECT id, status FROM public.available_slots ORDER BY created_at DESC LIMIT 1;

-- テスト予約を作成（トリガーが発動するはず）
INSERT INTO public.appointments (slot_id, company_id, user_id, requested_by, status)
VALUES (
  '<上記のslot_id>',
  (SELECT company_id FROM public.users WHERE role = 'company_user' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'company_user' LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'company_user' LIMIT 1),
  'pending'  -- トリガーで 'approved' に変わるはず
);

-- 結果確認
SELECT
  a.id,
  a.status,  -- 'approved' になっているはず
  s.status   -- 'booked' になっているはず
FROM public.appointments a
JOIN public.available_slots s ON a.slot_id = s.id
ORDER BY a.created_at DESC
LIMIT 1;
```

**期待結果:**
- [ ] `appointments.status` が `'approved'` になっている
- [ ] `available_slots.status` が `'booked'` になっている

---

### テスト3: キャンセル時のスロット解放

**手順:**
1. 整体利用者アカウントでログイン
2. 予約一覧から予約をキャンセル

**期待結果:**
- [ ] 予約のステータスが `'cancelled'` になる
- [ ] `available_slots` のステータスが `'available'` に戻る
- [ ] いつでもキャンセルできる（時間制限なし）

確認クエリ:
```sql
-- キャンセルをテスト（手動で実行）
-- まず、approved の予約を1つ選ぶ
SELECT id, slot_id, status
FROM public.appointments
WHERE status = 'approved'
LIMIT 1;

-- キャンセルを実行
UPDATE public.appointments
SET
  status = 'cancelled',
  cancelled_at = NOW(),
  cancelled_by = user_id
WHERE id = '<上記のappointment_id>';

-- 結果確認
SELECT
  a.id,
  a.status,  -- 'cancelled' になっているはず
  s.status   -- 'available' に戻っているはず
FROM public.appointments a
JOIN public.available_slots s ON a.slot_id = s.id
WHERE a.id = '<上記のappointment_id>';
```

---

### テスト4: 整体師画面での表示

**手順:**
1. 整体師アカウントでログイン
2. 予約管理画面を表示

**期待結果:**
- [ ] 承認ボタンが表示されない
- [ ] 予約のステータスが「予約確定」と表示される
- [ ] 利用者名（`users.full_name`）が表示される
- [ ] `employee_name` は表示されない

---

### テスト5: カレンダープライバシー（将来実装）

**現状**: まだ実装していないため、スキップ

**将来のテスト内容:**
- [ ] 自社の予約: 法人名と利用者名が表示される
- [ ] 他社の予約: 「予約済み」とだけ表示される
- [ ] 他社の利用者名は非表示

---

## 🚨 エラーハンドリング

### よくあるエラーと対処法

#### エラー1: `user_id` が NULL のまま予約が作成される

**原因**: トリガーが正しく動作していない

**確認方法:**
```sql
-- トリガーの存在確認
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'auto_approve_appointment_trigger';
```

**対処法:**
```sql
-- トリガーを再作成
DROP TRIGGER IF EXISTS auto_approve_appointment_trigger ON public.appointments;

CREATE TRIGGER auto_approve_appointment_trigger
  BEFORE INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_appointment();
```

---

#### エラー2: キャンセル時にスロットが `available` に戻らない

**原因**: キャンセルトリガーが正しく動作していない

**確認方法:**
```sql
-- トリガーの存在確認
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'release_slot_on_cancel_trigger';
```

**対処法:**
```sql
-- トリガーを再作成
DROP TRIGGER IF EXISTS release_slot_on_cancel_trigger ON public.appointments;

CREATE TRIGGER release_slot_on_cancel_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION public.release_slot_on_cancel();
```

---

#### エラー3: 外部キー制約違反

**エラーメッセージ:**
```
insert or update on table "appointments" violates foreign key constraint "appointments_user_id_fkey"
```

**原因**: `user_id` に存在しないユーザーIDが設定されている

**対処法:**
```sql
-- 存在しないユーザーを参照している予約を確認
SELECT
  a.id,
  a.user_id,
  a.employee_name
FROM public.appointments a
LEFT JOIN public.users u ON a.user_id = u.id
WHERE a.user_id IS NOT NULL
  AND u.id IS NULL;

-- 該当する予約を修正（例: requested_by を使用）
UPDATE public.appointments
SET user_id = requested_by
WHERE id IN (
  SELECT a.id
  FROM public.appointments a
  LEFT JOIN public.users u ON a.user_id = u.id
  WHERE a.user_id IS NOT NULL
    AND u.id IS NULL
);
```

---

## 📊 統計情報

マイグレーション後の統計を確認:

```sql
-- 予約の統計
SELECT
  status,
  COUNT(*) as count,
  COUNT(user_id) as count_with_user_id,
  COUNT(*) - COUNT(user_id) as count_without_user_id
FROM public.appointments
GROUP BY status
ORDER BY status;

-- 空き枠の統計
SELECT
  status,
  COUNT(*) as count
FROM public.available_slots
GROUP BY status
ORDER BY status;

-- 利用者アカウントの統計
SELECT
  role,
  COUNT(*) as count,
  COUNT(company_id) as count_with_company
FROM public.users
GROUP BY role
ORDER BY role;
```

---

## ✅ 完了チェックリスト

### データベース
- [ ] `appointments.user_id` カラムが存在する
- [ ] `appointments.status` のデフォルト値が `'approved'`
- [ ] `calendar_slots_for_users` ビューが作成されている
- [ ] `calendar_slots_for_staff` ビューが作成されている
- [ ] `auto_approve_appointment_trigger` が動作している
- [ ] `release_slot_on_cancel_trigger` が動作している

### データ移行
- [ ] 既存の予約に `user_id` が設定されている
- [ ] データ整合性チェックでエラーがない

### 機能テスト
- [ ] 予約の即時承認が動作する
- [ ] キャンセル時にスロットが解放される
- [ ] 整体師画面で承認ボタンが表示されない
- [ ] 利用者名が正しく表示される

### コードデプロイ
- [ ] 更新されたコードを本番環境にデプロイ
- [ ] デプロイ後の動作確認

---

## 🔄 ロールバック手順（問題が発生した場合）

### 1. データベースのロールバック

```sql
-- appointments テーブルから user_id カラムを削除
ALTER TABLE public.appointments DROP COLUMN IF EXISTS user_id;

-- status のデフォルト値を戻す
ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'pending';

-- ビューを削除
DROP VIEW IF EXISTS public.calendar_slots_for_users;
DROP VIEW IF EXISTS public.calendar_slots_for_staff;

-- トリガーを削除
DROP TRIGGER IF EXISTS auto_approve_appointment_trigger ON public.appointments;
DROP TRIGGER IF EXISTS release_slot_on_cancel_trigger ON public.appointments;

-- トリガー関数を削除
DROP FUNCTION IF EXISTS public.auto_approve_appointment();
DROP FUNCTION IF EXISTS public.release_slot_on_cancel();
```

### 2. コードのロールバック

```bash
# 変更前のコミットに戻す
git log --oneline  # 変更前のコミットを確認
git revert <commit-hash>  # または git reset --hard <commit-hash>
```

---

## 📞 サポート

問題が発生した場合:
1. このチェックリストの「エラーハンドリング」セクションを確認
2. [詳細実装ガイド](./BOOKING_FLOW_REDESIGN.md)を参照
3. [変更サマリー](./BOOKING_FLOW_CHANGES_SUMMARY.md)を確認

---

**作成日**: 2025年12月5日
**最終更新**: 2025年12月5日
