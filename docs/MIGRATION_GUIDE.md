# データベースマイグレーション手順書

## 予約キャンセル通知機能のマイグレーション

### 概要
予約キャンセル時に整体師へ通知を送信する機能を追加するため、`notifications` テーブルの `type` 制約に `appointment_cancelled` を追加する必要があります。

### マイグレーションファイル
`supabase/migrations/20250110000000_add_appointment_cancelled_notification.sql`

### 適用方法

#### 方法1: Supabase CLI（推奨）

```bash
# Supabaseにログイン
npx supabase login

# プロジェクトにリンク
npx supabase link --project-ref <YOUR_PROJECT_REF>

# マイグレーションを適用
npx supabase db push
```

#### 方法2: Supabase Dashboard（手動）

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 以下のSQLを実行:

```sql
-- 通知タイプに appointment_cancelled を追加
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'appointment_cancelled', 'reminder'));
```

5. 「Run」ボタンをクリック

### 確認方法

マイグレーションが正しく適用されたか確認するには、以下のSQLを実行します:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'notifications_type_check';
```

**期待される結果:**
```
conname: notifications_type_check
pg_get_constraintdef: CHECK ((type = ANY (ARRAY['appointment_requested'::text, 'appointment_approved'::text, 'appointment_rejected'::text, 'appointment_cancelled'::text, 'reminder'::text])))
```

### デバッグ

キャンセル通知が送信されない場合、以下を確認してください:

#### 1. ブラウザのコンソールログ確認
開発者ツール（F12）を開き、Consoleタブで以下のログを確認:

- `Cancellation notification - therapist user ID: [ID]`
- `Creating cancellation notification for therapist: [ID]`
- `createNotification called: { userId, type, title, appointmentId }`
- `Notification created successfully: { userId, type, title }`

#### 2. エラーログの確認

**エラーが出ている場合:**
```
Failed to create notification: [error details]
```

**考えられる原因:**
- マイグレーションが未適用（`type` 制約違反）
- RLSポリシーの問題
- 整体師ユーザー情報の取得失敗

#### 3. データベースの通知テーブル確認

Supabase Dashboard > Table Editor > notifications を開き、キャンセル後に新しいレコードが作成されているか確認します。

**確認項目:**
- `type` カラムが `appointment_cancelled` になっているか
- `user_id` が整体師のIDになっているか
- `appointment_id` が正しく設定されているか
- `created_at` が最新の日時になっているか

### トラブルシューティング

#### エラー: `new row for relation "notifications" violates check constraint "notifications_type_check"`

**原因:** マイグレーションが未適用

**解決方法:** 上記の「適用方法」を参照してマイグレーションを実行

#### エラー: `Therapist user ID not found in slot info`

**原因:** 整体師とユーザーの紐付けが正しくない

**解決方法:**
1. `therapists` テーブルで `user_id` が正しく設定されているか確認
2. `users` テーブルに該当ユーザーが存在するか確認

```sql
-- 整体師とユーザーの紐付けを確認
SELECT
  t.id as therapist_id,
  t.user_id,
  u.email,
  u.full_name
FROM therapists t
LEFT JOIN users u ON t.user_id = u.id
WHERE t.user_id IS NULL;  -- user_idがnullのレコードを確認
```

#### エラー: `Missing slot info or company info for cancellation notification`

**原因:** 空き枠または法人情報の取得に失敗

**解決方法:**
1. `available_slots` テーブルでslot_idが存在するか確認
2. `companies` テーブルでcompany_idが存在するか確認

```sql
-- 空き枠と法人の紐付けを確認
SELECT
  a.id as appointment_id,
  a.slot_id,
  a.company_id,
  s.id as slot_exists,
  c.id as company_exists
FROM appointments a
LEFT JOIN available_slots s ON a.slot_id = s.id
LEFT JOIN companies c ON a.company_id = c.id
WHERE a.status = 'cancelled'
ORDER BY a.cancelled_at DESC
LIMIT 10;
```

### ロールバック方法

マイグレーションを元に戻す場合:

```sql
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'reminder'));
```

---

**作成日**: 2025年11月28日
**最終更新日**: 2025年11月28日
