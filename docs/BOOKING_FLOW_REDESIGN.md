# 予約フロー再設計ドキュメント

## 概要

このドキュメントは、予約フローの大幅な見直しに関する変更内容と実装手順をまとめたものです。

## 変更の背景

### 旧フロー（変更前）
- **ユーザーモデル**: 法人担当者が複数の社員の予約を代理で管理
- **予約フロー**: 申込 → 整体師承認 → 確定
- **キャンセル**: 前日20時まで
- **カレンダー**: 全ての予約情報が全ユーザーに表示

### 新フロー（変更後）
- **ユーザーモデル**: 整体利用者一人一人がアカウントを持つ
- **予約フロー**: 申込 = 即確定（承認ステップ廃止）
- **キャンセル**: いつでも可能
- **カレンダー**: 他社の個人情報は非表示

---

## 主要な変更点

### 1. ユーザーモデルの変更

#### 変更前
```
company_user = 法人の予約担当者
- AA法人の担当者Aさん → 社員1, 2, 3の予約を管理
```

#### 変更後
```
company_user = 個別の整体利用者
- AA法人-利用者1（独自アカウント）
- AA法人-利用者2（独自アカウント）
- AA法人-利用者3（独自アカウント）
```

**重要**: 各ユーザーは `company_id` で法人に紐付けられる

### 2. 予約フローの簡素化

#### 変更前
```
[利用者] 予約申込
    ↓ status: pending
[整体師] 承認 or 拒否
    ↓ status: approved/rejected
[予約確定 or 枠解放]
```

#### 変更後
```
[利用者] 予約申込
    ↓ 自動で status: approved
[予約確定]
```

### 3. キャンセル制限の撤廃

#### 変更前
- 前日20時まで: キャンセル可能
- 前日20時以降: キャンセル不可

#### 変更後
- **いつでもキャンセル可能**（時間制限なし）

### 4. カレンダー表示のプライバシー制御

#### 変更前（全ユーザーが全情報を閲覧可能）
```
カレンダー表示:
- 整体師名: 表示
- 法人名: 表示（全ての法人）
- 社員名: 表示（全ての社員）
```

#### 変更後（プライバシー保護）
```
【自社の予約】
- 整体師名: 表示
- 法人名: 表示（自社名）
- 利用者名: 表示（自社の利用者）

【他社の予約】
- 整体師名: 表示
- 法人名: 非表示（「予約済み」と表示）
- 利用者名: 非表示
```

---

## データベース変更

### テーブル変更

#### `appointments` テーブル

**追加カラム:**
- `user_id`: 予約した利用者のID（`users.id` を参照）

**非推奨カラム（削除しないが使用しない）:**
- `employee_name`: `users.full_name` を使用
- `employee_id`: `users.id` を使用
- `requested_by`: `user_id` を使用
- `rejected_reason`: 拒否機能廃止のため不要

**ステータスの変更:**
- デフォルト値: `pending` → `approved`
- 使用ステータス: `approved`, `cancelled`, `completed`
- 廃止ステータス: `pending`, `rejected`

#### `available_slots` テーブル

**ステータスの変更:**
- 使用ステータス: `available`, `booked`, `cancelled`
- 廃止ステータス: `pending`

#### `notifications` テーブル

**廃止する通知タイプ:**
- `appointment_requested`: 整体師への承認依頼通知（不要）
- `appointment_rejected`: 拒否通知（不要）

**継続する通知タイプ:**
- `appointment_approved`: 予約確定通知（即時確定なので「予約完了」に名称変更）
- `reminder`: リマインド通知

### 新規ビュー

#### `calendar_slots_for_users`
利用者向けカレンダービュー（他社の個人情報は非表示）

```sql
select
  s.id as slot_id,
  s.start_time,
  s.end_time,
  -- 自社の予約のみ法人名と利用者名を表示
  case
    when 自社の予約 then c.name
    else '予約済み'
  end as company_name,
  case
    when 自社の予約 then u.full_name
    else null
  end as user_name
from available_slots s
left join appointments a on s.id = a.slot_id
...
```

#### `calendar_slots_for_staff`
管理者・整体師向けカレンダービュー（全情報表示）

```sql
select
  s.id as slot_id,
  s.start_time,
  s.end_time,
  c.name as company_name,      -- 全て表示
  u.full_name as user_name,    -- 全て表示
  a.symptoms,
  a.notes
from available_slots s
left join appointments a on s.id = a.slot_id
...
```

### 新規トリガー

#### `auto_approve_appointment_trigger`
予約作成時に自動的に `status = approved` に設定し、スロットを `booked` にする

#### `release_slot_on_cancel_trigger`
キャンセル時にスロットを `available` に戻す

---

## マイグレーション手順

### 1. マイグレーション実行前の確認

```bash
# 現在のマイグレーション状態を確認
npx supabase migration list

# 既存データのバックアップ（推奨）
# Supabaseダッシュボードから手動バックアップを取得
```

### 2. マイグレーション実行

```bash
# ローカル環境でテスト
npx supabase db reset

# 本番環境へのデプロイ
npx supabase db push
```

### 3. 既存データの移行

**重要**: 既存の `appointments` データに `user_id` を設定する必要があります。

```sql
-- オプション1: 法人担当者アカウントを個別利用者アカウントに変換
-- （既存の予約を保持する場合）

-- 既存の予約に対して、requested_by を user_id として設定
update public.appointments
set user_id = requested_by
where user_id is null;

-- オプション2: 既存データを削除して新規スタート
-- （テスト環境の場合）

truncate public.appointments cascade;
```

### 4. 動作確認

```sql
-- 予約が自動承認されることを確認
select id, status, user_id, company_id
from public.appointments
order by created_at desc
limit 10;

-- カレンダービューが正しく動作することを確認
select *
from public.calendar_slots_for_users
limit 10;
```

---

## コード変更

### 1. 予約作成フォーム

**変更ファイル**: `src/app/(protected)/company/appointments/new/page.tsx`

#### 変更前
```tsx
<input
  type="text"
  name="employee_name"
  required
  placeholder="山田 太郎"
/>
<input
  type="text"
  name="employee_id"
  required
  placeholder="EMP-12345"
/>
```

#### 変更後
```tsx
{/* employee_name と employee_id は不要 */}
{/* 現在ログイン中のユーザー情報を使用 */}
<input type="hidden" name="user_id" value={user.id} />

{/* フォームには利用者自身の情報を表示 */}
<div className="mb-4">
  <p className="text-sm text-gray-600">
    予約者: {userProfile.full_name}
  </p>
</div>
```

### 2. 予約作成アクション

**変更ファイル**: `src/app/(protected)/company/appointments/actions.ts`

#### 変更前
```typescript
export async function createAppointment(formData: FormData) {
  const employee_name = formData.get('employee_name') as string
  const employee_id = formData.get('employee_id') as string

  const { error } = await supabase
    .from('appointments')
    .insert({
      slot_id,
      company_id,
      requested_by: user.id,
      employee_name,
      employee_id,
      symptoms,
      notes,
      status: 'pending' // 承認待ち
    })
}
```

#### 変更後
```typescript
export async function createAppointment(formData: FormData) {
  const user_id = user.id // ログイン中のユーザー

  const { error } = await supabase
    .from('appointments')
    .insert({
      slot_id,
      company_id,
      user_id,           // 新フィールド
      requested_by: user_id, // 互換性のため残す
      symptoms,
      notes,
      // status は自動的に 'approved' になる（トリガーで設定）
    })
}
```

### 3. カレンダーコンポーネント

**変更ファイル**: `src/components/calendar/schedule-calendar.tsx`

#### 変更前
```typescript
// 全てのスロットとアポイントメント情報を取得
const { data: slots } = await supabase
  .from('available_slots')
  .select(`
    *,
    appointments (
      *,
      companies (name)
    )
  `)
```

#### 変更後
```typescript
// ロールに応じてビューを切り替え
const viewName = userRole === 'company_user'
  ? 'calendar_slots_for_users'    // プライバシー保護
  : 'calendar_slots_for_staff'     // 全情報表示

const { data: slots } = await supabase
  .from(viewName)
  .select('*')
  .order('start_time')
```

### 4. 整体師の承認機能を削除

**削除ファイル:**
- `src/app/(protected)/therapist/appointments/approval-buttons.tsx`

**変更ファイル:**
- `src/app/(protected)/therapist/appointments/page.tsx`

#### 変更前
```tsx
{appointment.status === 'pending' && (
  <ApprovalButtons appointmentId={appointment.id} />
)}
```

#### 変更後
```tsx
{/* 承認ボタンは削除（即時確定のため不要） */}
{appointment.status === 'approved' && (
  <p className="text-green-600">予約確定</p>
)}
```

### 5. キャンセル制限の削除

**変更ファイル**: `src/app/(protected)/company/appointments/cancel-button.tsx`

#### 変更前
```typescript
// 前日20時までのみキャンセル可能
const now = new Date()
const appointmentTime = new Date(appointment.slot.start_time)
const cancelDeadline = new Date(appointmentTime)
cancelDeadline.setDate(cancelDeadline.getDate() - 1)
cancelDeadline.setHours(20, 0, 0, 0)

const canCancel = now < cancelDeadline

if (!canCancel) {
  return <p className="text-red-500">キャンセル期限を過ぎています</p>
}
```

#### 変更後
```typescript
// いつでもキャンセル可能
const canCancel = appointment.status === 'approved'

if (!canCancel) {
  return <p className="text-gray-500">キャンセル済みまたは完了済み</p>
}
```

### 6. 通知メッセージの変更

**変更ファイル**: 通知関連のコンポーネント

#### 変更前
```typescript
const notificationMessages = {
  appointment_requested: '新しい予約申込が届きました',
  appointment_approved: '予約が承認されました',
  appointment_rejected: '予約が拒否されました',
  reminder: '明日の予約のリマインド'
}
```

#### 変更後
```typescript
const notificationMessages = {
  appointment_approved: '予約が完了しました', // 即時確定
  reminder: '予約のリマインド',
  // appointment_requested と appointment_rejected は削除
}
```

---

## ユーザー登録フロー

### 管理者が行う操作

#### 1. 法人ユーザーの登録

**画面**: `/admin/users/new`

```tsx
<form>
  <select name="role" required>
    <option value="company_user">整体利用者</option>
    <option value="therapist">整体師</option>
    <option value="admin">管理者</option>
  </select>

  <select name="company_id" required>
    {/* 法人のリストから選択 */}
    <option value="uuid-aa-company">AA法人</option>
    <option value="uuid-bb-company">BB法人</option>
  </select>

  <input type="text" name="full_name" placeholder="山田 太郎" required />
  <input type="email" name="email" placeholder="yamada@example.com" required />

  <button type="submit">ユーザーを登録</button>
</form>
```

#### 2. 初期パスワードの発行

```typescript
// Supabase Admin APIで初期パスワードを設定
const initialPassword = generateRandomPassword()

const { data, error } = await supabase.auth.admin.createUser({
  email: 'yamada@example.com',
  password: initialPassword,
  email_confirm: true,
  user_metadata: {
    full_name: '山田 太郎'
  }
})

// users テーブルにレコード作成
await supabase.from('users').insert({
  id: data.user.id,
  email: 'yamada@example.com',
  full_name: '山田 太郎',
  role: 'company_user',
  company_id: 'uuid-aa-company',
  must_change_password: true // 初回ログイン時に変更を強制
})

// 初期パスワードをメールまたは画面で通知
console.log(`初期パスワード: ${initialPassword}`)
```

### 利用者の初回ログイン

#### 1. ログイン画面

```
メールアドレス: yamada@example.com
パスワード: [初期パスワード]
```

#### 2. パスワード変更画面（強制）

```tsx
{userProfile.must_change_password && (
  <PasswordChangeForm userId={user.id} />
)}
```

```typescript
// パスワード変更後
await supabase.from('users').update({
  must_change_password: false
}).eq('id', user.id)
```

---

## テストシナリオ

### 1. 予約の即時確定テスト

```
【手順】
1. 整体利用者アカウントでログイン
2. カレンダーから空き枠を選択
3. 予約申込
4. 予約一覧を確認

【期待結果】
- 予約のステータスが 'approved' になっている
- 通知に「予約が完了しました」が表示される
- 整体師に承認依頼通知は送られない
```

### 2. カレンダーのプライバシーテスト

```
【手順】
1. AA法人の利用者Aでログイン
2. カレンダーを表示
3. BB法人の予約が入っている枠を確認

【期待結果】
- AA法人の予約: 法人名・利用者名が表示される
- BB法人の予約: 「予約済み」とだけ表示され、法人名・利用者名は非表示
```

### 3. キャンセル制限テスト

```
【手順】
1. 過去の日付の予約を確認
2. 当日の予約を確認
3. 未来の予約を確認
4. それぞれキャンセルボタンをクリック

【期待結果】
- 全ての予約で「キャンセル」ボタンが表示される
- キャンセル時刻の制限がない
```

### 4. ユーザー登録テスト

```
【手順】
1. 管理者で新規ユーザーを登録
2. 初期パスワードを取得
3. 新規ユーザーでログイン
4. パスワード変更画面が表示されることを確認
5. パスワードを変更
6. ダッシュボードに遷移

【期待結果】
- パスワード変更が強制される
- 変更後は通常通りログイン可能
```

---

## 注意事項

### データ移行について

既存の予約データがある場合、以下の対応が必要です:

1. **既存の法人担当者アカウントを個別利用者アカウントに変換する場合:**
   - `employee_name` と `employee_id` から個別ユーザーを作成
   - 既存の予約に `user_id` を設定

2. **新規スタートする場合:**
   - 既存の予約データを削除
   - 利用者に新規アカウントを作成してもらう

### 後方互換性

以下のカラムは削除せず、非推奨として残します:
- `appointments.employee_name`
- `appointments.employee_id`
- `appointments.requested_by`
- `appointments.rejected_reason`

これにより、既存データの参照が可能になります。

### 通知の変更

整体師への通知は以下のように変更されます:
- ❌ 削除: 新規予約申込の通知（即時確定のため不要）
- ✅ 継続: リマインド通知（前日20:00）

---

## 実装チェックリスト

### データベース
- [x] マイグレーションファイル作成
- [ ] マイグレーション実行（ローカル）
- [ ] マイグレーション実行（本番）
- [ ] 既存データの移行

### バックエンド
- [ ] 予約作成アクションの更新
- [ ] カレンダー取得クエリの更新
- [ ] キャンセルロジックの更新
- [ ] 通知ロジックの更新

### フロントエンド
- [ ] 予約申込フォームの更新
- [ ] カレンダーコンポーネントの更新
- [ ] 整体師承認ボタンの削除
- [ ] キャンセルボタンの更新
- [ ] 通知メッセージの更新

### ユーザー管理
- [ ] ユーザー登録フォームの作成
- [ ] 初期パスワード発行機能
- [ ] パスワード変更強制機能

### テスト
- [ ] 予約即時確定のテスト
- [ ] カレンダープライバシーのテスト
- [ ] キャンセル制限撤廃のテスト
- [ ] ユーザー登録フローのテスト

---

## 今後の拡張

### フェーズ2（将来機能）
- セルフサービスユーザー登録（メール認証）
- 法人管理者ロール（法人内のユーザー管理）
- 予約の自動リマインド（SMS/LINE）
- 予約の繰り返し設定

---

## 参考リンク

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Views](https://supabase.com/docs/guides/database/views)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

---

**作成日**: 2025年12月5日
**バージョン**: 1.0
**作成者**: Claude Code
