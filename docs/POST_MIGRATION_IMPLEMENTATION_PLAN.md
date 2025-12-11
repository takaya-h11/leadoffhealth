# マイグレーション後の実装計画

**作成日**: 2025年12月9日
**ステータス**: マイグレーション完了、実装タスク洗い出し完了

---

## ✅ 完了事項

### 1. マイグレーション実施
- ✅ `20250111000000_redesign_booking_flow.sql` 適用完了
- ✅ `20250112000000_add_company_specific_slots.sql` 適用完了

### 2. コード変更
- ✅ 予約作成フォーム（`company/appointments/new/page.tsx`）
  - 社員名・社員IDフィールド削除
  - 利用者本人の情報表示
- ✅ 予約作成アクション（`company/appointments/actions.ts`）
  - `user_id` の設定
  - 即時承認ロジック
  - キャンセル制限の撤廃
- ✅ 整体師の予約管理画面（`therapist/appointments/page.tsx`）
  - 承認ボタンの削除
  - 利用者名の表示

### 3. 確認用スクリプト作成
- ✅ `scripts/verify-migration.sql` - マイグレーション状態確認
- ✅ `scripts/migrate-existing-data.sql` - 既存データ移行

---

## 🔄 次のステップ

### ステップ1: マイグレーション確認（即座に実施）

1. **Supabase SQL Editorで確認スクリプトを実行**
   - URL: https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
   - 実行するスクリプト: `scripts/verify-migration.sql`

2. **確認項目:**
   - [ ] `appointments.user_id` カラムが存在する
   - [ ] `available_slots.company_id` カラムが存在する
   - [ ] ビュー `calendar_slots_for_users` が作成されている
   - [ ] ビュー `calendar_slots_for_staff` が作成されている
   - [ ] トリガー `auto_approve_appointment_trigger` が存在する
   - [ ] トリガー `release_slot_on_cancel_trigger` が存在する
   - [ ] RLSポリシーが正しく設定されている

### ステップ2: 既存データ移行（確認後に実施）

1. **既存の予約データに `user_id` を設定**
   - 実行するスクリプト: `scripts/migrate-existing-data.sql`
   - このスクリプトは `requested_by` を `user_id` にコピーします

2. **データ整合性チェック**
   - スクリプトが自動的にチェックを実行
   - 問題があれば結果に表示される

### ステップ3: 動作確認テスト

#### テスト1: 予約の即時承認
- [ ] 整体利用者でログイン
- [ ] 空き枠を選択して予約
- [ ] ステータスが `approved` になることを確認
- [ ] 整体師に「予約確定」通知が届くことを確認

#### テスト2: キャンセル制限撤廃
- [ ] いつでもキャンセルボタンが表示されることを確認
- [ ] キャンセル後、スロットが `available` に戻ることを確認

#### テスト3: 法人専用空き枠
- [ ] 整体師が法人専用枠を作成できることを確認
- [ ] 法人Aでログインして自社専用枠が見えることを確認
- [ ] 法人Bでログインして法人A専用枠が見えないことを確認

---

## 🚧 未実装タスク（優先度順）

### 🔴 優先度: 高（即座に実装が必要）

#### 1. 予約一覧での `employee_name` 参照を修正

**影響ファイル:**
- `src/app/(protected)/admin/appointments/page.tsx` (L88-90)
- `src/app/(protected)/company/appointments/page.tsx` (L75-78)

**現状の問題:**
```typescript
// 検索で employee_name を使用している
query = query.or(`employee_name.ilike.%${params.search}%,employee_id.ilike.%${params.search}%`)
```

**修正方針:**
```typescript
// user_id から users.full_name を参照するように変更
// またはビューを使用して検索
```

**詳細:**
- 予約一覧のクエリに `users` テーブルの JOIN を追加
- `user_id` から `users.full_name` を取得
- 検索フィルターを修正（`employee_name` → `users.full_name`）

---

#### 2. 予約一覧での利用者名表示の修正

**影響ファイル:**
- `src/app/(protected)/admin/appointments/page.tsx`
- `src/app/(protected)/company/appointments/page.tsx`
- `src/app/(protected)/therapist/appointments/all/page.tsx`

**現状の問題:**
```tsx
{/* employee_name が表示されている */}
<td>{appointment.employee_name}</td>
```

**修正方針:**
```tsx
{/* users.full_name を表示する */}
<td>{appointment.users?.full_name}</td>
```

**詳細:**
- クエリに `users` テーブルを追加
- 外部キー名を確認（`appointments_user_id_fkey`）
- 表示を `appointment.users?.full_name` に変更

---

### 🟡 優先度: 中（動作に影響するが回避可能）

#### 3. カレンダーコンポーネントでのプライバシーフィルター

**影響ファイル:**
- `src/app/(protected)/company/schedule/page.tsx`
- `src/app/(protected)/company/schedule/company-schedule-calendar.tsx`

**現状の問題:**
- 他社の予約情報（法人名・利用者名）が表示される
- `available_slots` テーブルから直接取得している

**修正方針:**
```typescript
// company_user の場合は calendar_slots_for_users ビューを使用
// admin, therapist の場合は calendar_slots_for_staff ビューを使用

const viewName = userRole === 'company_user'
  ? 'calendar_slots_for_users'
  : 'calendar_slots_for_staff'

const { data: slots } = await supabase
  .from(viewName)
  .select('*')
```

**詳細:**
- ビューはマイグレーションで作成済み
- ビューの構造を確認して、クエリを修正
- カレンダーコンポーネントで他社情報を非表示にする

---

#### 4. 管理者の予約代理作成での `user_id` 設定

**影響ファイル:**
- `src/app/(protected)/company/appointments/new/page.tsx` (管理者が法人ユーザーとして予約を作成する場合)

**現状の問題:**
- 管理者が代理で予約を作成する場合、`user_id` が管理者のIDになる可能性

**修正方針:**
```typescript
// 管理者が代理予約を作成する場合は、利用者を選択させる
// または、管理者専用の予約作成フォームを作成
```

**詳細:**
- 管理者が予約を作成する際、利用者を選択するドロップダウンを追加
- 選択した利用者の `id` を `user_id` に設定

---

### 🟢 優先度: 低（将来実装）

#### 5. 施術記録での利用者名表示

**影響ファイル:**
- `src/app/(protected)/therapist/appointments/[id]/view/TreatmentReportView.tsx`

**現状:**
- 施術記録に `employee_name` が保存されている可能性
- 新規作成時は `users.full_name` を使用する必要

**修正方針:**
```typescript
// 施術記録作成時に users.full_name を参照
// 表示時も user_id から取得
```

---

#### 6. レポート生成での `user_id` 対応

**影響ファイル:**
- 月次レポート生成機能（未実装）
- 請求書生成機能（未実装）

**修正方針:**
- レポート生成時に `user_id` から利用者情報を取得
- 実人数のカウントは `user_id` でグルーピング

---

## 📝 実装チェックリスト

### データベース確認
- [ ] マイグレーション確認スクリプトを実行（`scripts/verify-migration.sql`）
- [ ] 既存データ移行スクリプトを実行（`scripts/migrate-existing-data.sql`）
- [ ] データ整合性チェックでエラーがないことを確認

### 優先度: 高（即座に実装）
- [ ] 予約一覧のクエリ修正（`user_id` → `users.full_name`）
- [ ] 予約一覧の表示修正（`employee_name` → `users.full_name`）
- [ ] 検索フィルターの修正

### 優先度: 中（次のイテレーション）
- [ ] カレンダープライバシーフィルター実装
- [ ] 管理者の予約代理作成での利用者選択

### 優先度: 低（将来）
- [ ] 施術記録での利用者名表示修正
- [ ] レポート生成機能での `user_id` 対応

### 動作確認
- [ ] 予約の即時承認テスト
- [ ] キャンセル制限撤廃テスト
- [ ] 法人専用空き枠テスト
- [ ] 検索機能のテスト
- [ ] カレンダー表示のテスト

---

## 🔧 実装ガイド

### 予約一覧のクエリ修正例

**修正前:**
```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    available_slots!inner (...),
    companies (name)
  `)
  .or(`employee_name.ilike.%${params.search}%,employee_id.ilike.%${params.search}%`)
```

**修正後:**
```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    available_slots!inner (...),
    companies (name),
    users!appointments_user_id_fkey (
      full_name,
      email
    )
  `)
  // 検索: user_id から users.full_name を参照
  // 注意: ネストしたリレーションの検索は複雑なため、後でフィルタリング
```

**代替案:**
```typescript
// フロントエンドで検索をフィルタリング
const filteredAppointments = appointments?.filter(a =>
  a.users?.full_name?.toLowerCase().includes(params.search.toLowerCase())
)
```

---

### カレンダープライバシーフィルター実装例

**修正箇所:** `src/app/(protected)/company/schedule/page.tsx`

```typescript
// ユーザーのロールを取得
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single()

// ロールに応じてビューを切り替え
const viewName = userProfile?.role === 'company_user'
  ? 'calendar_slots_for_users'
  : 'calendar_slots_for_staff'

// ビューからデータ取得
const { data: slots } = await supabase
  .from(viewName)
  .select('*')
  .gte('start_time', startOfMonth.toISOString())
  .lte('end_time', endOfMonth.toISOString())
```

---

## 📚 関連ドキュメント

- [予約フロー再設計ガイド](./BOOKING_FLOW_REDESIGN.md)
- [変更サマリー](./BOOKING_FLOW_CHANGES_SUMMARY.md)
- [マイグレーション後チェックリスト](./POST_MIGRATION_CHECKLIST.md)
- [法人専用空き枠マイグレーション](./COMPANY_SPECIFIC_SLOTS_MIGRATION.md)

---

## 🐛 既知の問題

### 問題1: 検索フィルターが動作しない
- **原因**: `employee_name` が非推奨カラムになった
- **対処**: クエリを修正して `users.full_name` を参照
- **影響**: 予約一覧の検索機能

### 問題2: カレンダーに他社の個人情報が表示される
- **原因**: プライバシーフィルターが未実装
- **対処**: ビューを使用するように修正
- **影響**: 法人担当者のプライバシー保護

---

## 📞 質問・問題報告

問題が発生した場合:
1. このドキュメントの「既知の問題」セクションを確認
2. `scripts/verify-migration.sql` を実行してマイグレーション状態を確認
3. GitHub Issueで報告

---

**最終更新**: 2025年12月9日
