# 017: 空き枠登録機能（整体師）

## 概要
整体師が自分の空き枠を登録できる機能を実装する。空き枠は日時と施術メニューを指定して1つずつ登録する。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ `available_slots`, `therapists`, `service_menus`テーブルが作成されている
- ✅ RLSポリシーが設定されている

## タスク

### 1. 空き枠登録ページ作成
- [ ] `src/app/(protected)/therapist/slots`ディレクトリを作成
- [ ] `src/app/(protected)/therapist/slots/new/page.tsx`を作成
- [ ] 整体師権限チェックを実装
- [ ] 空き枠登録フォームを実装

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAvailableSlot } from '../actions'

export default async function NewSlotPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ユーザーのロールを確認
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, therapists(id)')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist') {
    redirect('/dashboard')
  }

  // 有効な施術メニュー一覧を取得
  const { data: serviceMenus } = await supabase
    .from('service_menus')
    .select('*')
    .eq('is_active', true)
    .order('duration_minutes')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">空き枠登録</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createAvailableSlot}>
            <input
              type="hidden"
              name="therapist_id"
              value={userProfile.therapists?.[0]?.id}
            />

            <div className="mb-4">
              <label htmlFor="service_menu_id" className="block text-sm font-medium text-gray-700">
                施術メニュー <span className="text-red-500">*</span>
              </label>
              <select
                id="service_menu_id"
                name="service_menu_id"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {serviceMenus?.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name} （{menu.duration_minutes}分 / ¥{menu.price.toLocaleString()}）
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                  開始時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                  終了時刻 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6 rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-900">注意事項</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• 終了時刻は開始時刻より後の時刻を指定してください</li>
                <li>• 施術メニューの時間と一致している必要はありません</li>
                <li>• 予約が入っていない枠は後から削除できます</li>
                <li>• 過去の日時は登録できません</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                href="/therapist/slots"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                登録
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
```

### 2. Server Actions作成
- [ ] `src/app/(protected)/therapist/slots/actions.ts`を作成
- [ ] `createAvailableSlot` - 空き枠登録
- [ ] バリデーション（日時の妥当性チェック）を実装

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createAvailableSlot(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, therapists(id)')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist') {
    redirect('/dashboard')
  }

  const therapistId = formData.get('therapist_id') as string
  const serviceMenuId = formData.get('service_menu_id') as string
  const startDate = formData.get('start_date') as string
  const startTime = formData.get('start_time') as string
  const endTime = formData.get('end_time') as string

  // バリデーション
  if (!therapistId || !serviceMenuId || !startDate || !startTime || !endTime) {
    redirect('/therapist/slots/new?message=All fields are required')
  }

  // 日時の組み立て
  const startDateTime = new Date(`${startDate}T${startTime}:00`)
  const endDateTime = new Date(`${startDate}T${endTime}:00`)

  // 日時の妥当性チェック
  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    redirect('/therapist/slots/new?message=Invalid date or time')
  }

  if (endDateTime <= startDateTime) {
    redirect('/therapist/slots/new?message=End time must be after start time')
  }

  // 過去の日時チェック
  if (startDateTime < new Date()) {
    redirect('/therapist/slots/new?message=Cannot create slot in the past')
  }

  // 重複チェック（同じ整体師の同じ時間帯に既に枠がないか）
  const { data: overlapping } = await supabase
    .from('available_slots')
    .select('id')
    .eq('therapist_id', therapistId)
    .neq('status', 'cancelled')
    .or(`and(start_time.lte.${endDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()})`)
    .limit(1)

  if (overlapping && overlapping.length > 0) {
    redirect('/therapist/slots/new?message=Time slot overlaps with existing slot')
  }

  // 自動削除日時を設定（施術日時から1週間後）
  const autoDeleteAt = new Date(startDateTime)
  autoDeleteAt.setDate(autoDeleteAt.getDate() + 7)

  const { error } = await supabase
    .from('available_slots')
    .insert({
      therapist_id: therapistId,
      service_menu_id: serviceMenuId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'available',
      auto_delete_at: autoDeleteAt.toISOString(),
    })

  if (error) {
    console.error('Slot creation error:', error)
    redirect('/therapist/slots/new?message=Failed to create slot')
  }

  revalidatePath('/therapist/slots')
  revalidatePath('/therapist/schedule')
  redirect('/therapist/slots?message=Slot created successfully')
}
```

### 3. 一括登録機能（将来実装）
- [ ] 同じ時間帯を複数日に一括登録
- [ ] 繰り返しパターンの設定（毎週月曜日など）

## 完了条件
- [ ] 空き枠登録ページが表示される
- [ ] 日付・時刻・施術メニューを指定して登録できる
- [ ] 終了時刻が開始時刻より後であることをチェック
- [ ] 過去の日時は登録できない
- [ ] 同じ時間帯に重複する枠は登録できない
- [ ] 自動削除日時が自動設定される（施術日時から1週間後）
- [ ] 整体師以外はアクセスできない
- [ ] 成功/エラーメッセージが表示される

## 注意事項
- 空き枠の時間は施術メニューの時間と一致している必要はない
- 予約が入っていない枠のみ削除可能
- status は 'available' で登録される
- auto_delete_at は施術日時から1週間後に自動設定
- 過去の空き枠（available状態）は自動削除される（Cron Jobsで実装）

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015-016: マスターデータ管理機能

## 次のステップ
- 018: 空き枠一覧・削除機能（整体師）
