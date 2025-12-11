# 予約フロー再設計 - 実装変更サマリー

**実装日**: 2025年12月5日
**ステータス**: コード変更完了、マイグレーション待ち

---

## 📝 変更概要

### 主要な変更点

1. ✅ **ユーザーモデルの変更**: 法人担当者 → 個別利用者アカウント
2. ✅ **予約フローの簡素化**: 申込 → 整体師承認 → 確定 ⇒ 申込 = 即時確定
3. ✅ **キャンセル制限の撤廃**: 前日20時まで ⇒ いつでも可能
4. ⏳ **カレンダープライバシー**: 他社の個人情報を非表示（マイグレーション後に実装予定）

---

## 🗂️ 変更されたファイル

### 1. データベースマイグレーション

#### 📄 `supabase/migrations/20250111000000_redesign_booking_flow.sql`
**新規作成**

主な変更:
- `appointments` テーブルに `user_id` カラム追加
- デフォルトステータスを `approved` に変更
- プライバシー制御用ビュー作成:
  - `calendar_slots_for_users`: 利用者向け（他社情報を隠す）
  - `calendar_slots_for_staff`: スタッフ向け（全情報表示）
- トリガー追加:
  - `auto_approve_appointment_trigger`: 予約を自動承認
  - `release_slot_on_cancel_trigger`: キャンセル時にスロット解放

### 2. 予約作成ロジック

#### 📄 `src/app/(protected)/company/appointments/actions.ts`

**変更内容:**

##### createAppointment 関数

```diff
- const employeeName = formData.get('employee_name') as string
- const employeeId = formData.get('employee_id') as string
  const notes = formData.get('notes') as string

- if (!slotId || !employeeName || !employeeId) {
+ if (!slotId) {
    redirect(...)
  }

- // 空き枠をpendingに更新
+ // 空き枠をbookedに更新（即時確定）
  const { error: updateError } = await supabase
    .from('available_slots')
    .update({
-     status: 'pending',
+     status: 'booked',
    })

- // 予約を作成
+ // 予約を作成（即時承認）
  const { error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      slot_id: slotId,
      company_id: companyId,
+     user_id: user.id,           // 新フィールド
      requested_by: user.id,
-     employee_name: employeeName.trim(),
-     employee_id: employeeId.trim(),
      symptoms: symptomsArray,
      notes: notes || null,
-     status: 'pending',
+     status: 'approved',
    })

- // 整体師に承認依頼通知を送信
+ // 整体師に予約確定通知を送信
  await createNotification(
    therapist.user_id,
-   'appointment_requested',
-   '新しい予約申込',
-   `${companyInfo.name}から...の予約申込が届きました`,
+   'appointment_approved',
+   '新しい予約が確定しました',
+   `${companyInfo.name}の${userData?.full_name}様...の予約が確定しました`,
    createdAppointment?.id
  )

  const successPath = isAdminBooking
-   ? `/admin/appointments?message=${encodeURIComponent('success: 予約を申し込みました')}`
-   : `/company/appointments?message=${encodeURIComponent('success: 予約を申し込みました')}`
+   ? `/admin/appointments?message=${encodeURIComponent('success: 予約が確定しました')}`
+   : `/company/appointments?message=${encodeURIComponent('success: 予約が確定しました')}`
```

##### cancelAppointment 関数

```diff
- // ステータスチェック（pending または approved のみキャンセル可能）
- if (appointment.status !== 'pending' && appointment.status !== 'approved') {
+ // ステータスチェック（approved のみキャンセル可能）
+ if (appointment.status !== 'approved') {
    redirect(...)
  }

- // キャンセル期限チェック（前日20時）
- const slot = Array.isArray(appointment.available_slots) ...
- const startTime = new Date(slot.start_time)
- const deadline = new Date(startTime)
- deadline.setDate(deadline.getDate() - 1)
- deadline.setHours(20, 0, 0, 0)
-
- const now = new Date()
- if (now > deadline) {
-   redirect('/company/appointments?message=' + encodeURIComponent('キャンセル期限（前日20時）を過ぎています'))
- }
+ // キャンセル期限チェックを削除（いつでもキャンセル可能）

+ // 予約した利用者の情報を取得
+ const { data: userData } = await supabase
+   .from('users')
+   .select('full_name')
+   .eq('id', appointment.user_id || appointment.requested_by)
+   .single()

  await createNotification(
    therapistUser.id,
    'appointment_cancelled',
    '予約がキャンセルされました',
-   `${companyInfo.name}の...予約がキャンセルされました（社員: ${appointment.employee_name}様）`,
+   `${companyInfo.name}の${userData?.full_name || '利用者'}様...の予約がキャンセルされました`,
    appointmentId
  )
```

### 3. 予約作成フォーム

#### 📄 `src/app/(protected)/company/appointments/new/page.tsx`

**変更内容:**

```diff
  const { data: userProfile } = await supabase
    .from('users')
-   .select('role, company_id')
+   .select('role, company_id, full_name')
    .eq('id', user.id)
    .single()

  <form action={createAppointment}>
    <input type="hidden" name="slot_id" value={slotId} />

+   {/* 予約者情報の表示（編集不可） */}
+   <div className="mb-6 rounded-md bg-gray-50 p-4">
+     <h3 className="text-sm font-semibold text-gray-700 mb-2">予約者情報</h3>
+     <p className="text-sm text-gray-600">
+       お名前: {userProfile?.full_name || '読み込み中...'}
+     </p>
+     <p className="text-sm text-gray-500 mt-1">
+       ※ 予約は本人のアカウントで行われます
+     </p>
+   </div>

-   <div className="mb-4">
-     <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
-       社員名 <span className="text-red-500">*</span>
-     </label>
-     <input type="text" id="employee_name" name="employee_name" required ... />
-   </div>
-
-   <div className="mb-4">
-     <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
-       社員ID（社員番号） <span className="text-red-500">*</span>
-     </label>
-     <input type="text" id="employee_id" name="employee_id" required ... />
-     <p className="mt-1 text-sm text-gray-500">
-       ※ 同姓同名の社員を区別するために必要です
-     </p>
-   </div>

    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700">
        症状（複数選択可）
      </label>
      ...
    </div>

-   <div className="mb-6 rounded-md bg-yellow-50 p-4">
-     <h3 className="text-sm font-semibold text-yellow-900">ご確認ください</h3>
-     <ul className="mt-2 space-y-1 text-sm text-yellow-800">
-       <li>• 申込後、整体師の承認をお待ちください</li>
-       <li>• キャンセルは前日20時まで可能です</li>
-       <li>• 承認されるまで、この時間枠はロックされます</li>
-     </ul>
-   </div>
+   <div className="mb-6 rounded-md bg-blue-50 p-4">
+     <h3 className="text-sm font-semibold text-blue-900">ご確認ください</h3>
+     <ul className="mt-2 space-y-1 text-sm text-blue-800">
+       <li>• 申込と同時に予約が確定します</li>
+       <li>• キャンセルはいつでも可能です</li>
+       <li>• 予約確定後、整体師に通知が届きます</li>
+     </ul>
+   </div>
  </form>
```

### 4. 整体師の予約管理画面

#### 📄 `src/app/(protected)/therapist/appointments/page.tsx`

**変更内容:**

```diff
- import { ApprovalButtons } from './approval-buttons'
+ // import { ApprovalButtons } from './approval-buttons' // 承認機能廃止のためコメントアウト

- // 自分宛のpendingとapproved予約を取得
+ // 自分宛のapproved予約を取得（pendingは廃止）
  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      appointments (
        id,
+       user_id,
-       employee_name,
-       employee_id,
        symptoms,
        notes,
        status,
        created_at,
        companies (
          name
        ),
-       users!requested_by (
+       users!appointments_user_id_fkey (
          full_name,
          email
        )
      )
    `)
    .eq('therapist_id', therapistId)
-   .in('appointments.status', ['pending', 'approved'])
+   .eq('appointments.status', 'approved')
    .order('start_time', { ascending: true })

  <p className="mt-2 text-sm text-gray-600">
-   {appointments.filter(a => a.status === 'pending').length}件の予約が承認待ち、
-   {appointments.filter(a => a.status === 'approved').length}件が承認済み
+   {appointments.filter(a => a.status === 'approved').length}件の予約が確定しています
  </p>

- // ステータスに応じた色設定
- const isPending = appointment.status === 'pending'
- const _isApproved = appointment.status === 'approved'
- const borderColor = isPending ? 'border-yellow-200' : 'border-blue-200'
- const bgColor = isPending ? 'bg-yellow-50' : 'bg-blue-50'
- const badgeBgColor = isPending ? 'bg-yellow-100' : 'bg-blue-100'
- const badgeTextColor = isPending ? 'text-yellow-800' : 'text-blue-800'
- const statusText = isPending ? '承認待ち' : '承認済み'
+ // ステータスに応じた色設定（承認済みのみ）
+ const borderColor = 'border-blue-200'
+ const bgColor = 'bg-blue-50'
+ const badgeBgColor = 'bg-blue-100'
+ const badgeTextColor = 'text-blue-800'
+ const statusText = '予約確定'

  <div className="flex items-center space-x-2 text-sm text-gray-700">
    <svg ... />
    <span>
-     {appointment.employee_name}（ID: {appointment.employee_id}）
+     {_requestedByUser?.full_name || '利用者'}
    </span>
  </div>

- {isPending && (
-   <ApprovalButtons appointmentId={appointment.id} slotId={appointment.slot_id} />
- )}
+ {/* 承認ボタンは削除（即時確定のため不要） */}
```

---

## 🎯 次のステップ

### 1. データベースマイグレーション実行

#### ローカル環境（Docker起動後）

```bash
# Dockerを起動してから実行
npx supabase db reset
```

#### 本番環境

```bash
# 本番環境へのマイグレーション適用
npx supabase db push
```

### 2. 既存データの移行

マイグレーション実行後、既存の予約データに `user_id` を設定する必要があります：

```sql
-- オプション1: requested_by を user_id として設定
UPDATE public.appointments
SET user_id = requested_by
WHERE user_id IS NULL;

-- オプション2: テスト環境なら全削除して新規スタート
TRUNCATE public.appointments CASCADE;
```

### 3. 動作確認

#### 確認項目:

- [ ] 予約作成時に即座に `status = 'approved'` になる
- [ ] `available_slots` が `booked` になる
- [ ] 利用者名がフォームに表示される
- [ ] 整体師に「予約確定」通知が届く
- [ ] キャンセルがいつでも可能
- [ ] 整体師画面に承認ボタンが表示されない
- [ ] 整体師画面に利用者名が表示される

---

## ⚠️ 注意事項

### マイグレーション前に必ず実施

1. **バックアップ取得**
   - Supabaseダッシュボードから手動バックアップ
   - 既存の予約データをエクスポート

2. **外部キー制約の確認**
   - `appointments.user_id` は `users.id` を参照
   - 既存データに `user_id` が NULL の場合、移行スクリプトが必要

3. **通知タイプの確認**
   - `appointment_requested` 通知が残っている場合、削除を検討
   - `appointment_approved` の意味が変わる（承認完了 → 予約完了）

### まだ実装していない機能

1. **カレンダープライバシー制御**
   - `calendar_slots_for_users` ビューの使用
   - カレンダーコンポーネントの更新
   - 他社情報の非表示化

2. **ユーザー登録フロー**
   - 管理者による個別ユーザー登録画面
   - 初期パスワード発行機能
   - パスワード変更強制機能

3. **管理画面の更新**
   - 予約一覧での `user_id` 対応
   - レポート生成での `user_id` 対応

---

## 📊 影響範囲

### 影響を受けるコンポーネント

✅ **変更済み:**
- 予約作成フォーム
- 予約作成アクション
- キャンセルアクション
- 整体師の予約管理画面

⏳ **未変更（要対応）:**
- 予約一覧表示（各ロール）
- 予約詳細表示
- カレンダーコンポーネント
- レポート生成機能
- 管理者の予約代理作成
- 施術記録表示

### データベーステーブル

✅ **変更済み:**
- `appointments`: `user_id` カラム追加、デフォルトステータス変更
- `available_slots`: コメント更新
- `users`: コメント更新

⏳ **新規作成（マイグレーション待ち）:**
- `calendar_slots_for_users` ビュー
- `calendar_slots_for_staff` ビュー
- 自動承認トリガー
- キャンセル時スロット解放トリガー

---

## 📚 関連ドキュメント

- [詳細実装ガイド](./BOOKING_FLOW_REDESIGN.md)
- [マイグレーションSQL](../supabase/migrations/20250111000000_redesign_booking_flow.sql)
- [プロジェクト要件定義](../CLAUDE.md)

---

## 🐛 既知の問題

### TypeScript型エラーの可能性

以下のクエリで外部キー名が変わったため、型エラーが発生する可能性があります：

```typescript
// 変更前
users!requested_by (full_name, email)

// 変更後
users!appointments_user_id_fkey (full_name, email)
```

解決方法:
1. Supabaseの型定義を再生成: `npx supabase gen types typescript --local > types/database.ts`
2. または、外部キー名を明示的に指定せず、自動推論に任せる

---

**作成者**: Claude Code
**最終更新**: 2025年12月5日
