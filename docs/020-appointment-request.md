# 020: 予約申込機能（法人担当者）

## 概要
法人担当者が空き枠を選択して予約を申し込む機能を実装する。社員名・社員ID・症状・要望を入力し、申込時点で枠がロック（status: pending）される。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ 空き枠管理機能が実装されている（017-019完了）
- ✅ `appointments`, `available_slots`, `symptoms`テーブルが作成されている

## タスク

### 1. 予約申込ページ作成
- [ ] `src/app/(protected)/company/appointments/new/page.tsx`を作成
- [ ] 法人担当者権限チェックを実装
- [ ] 予約申込フォームを実装
- [ ] URLパラメータから空き枠IDを取得

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAppointment } from '../actions'

interface PageProps {
  searchParams: Promise<{
    slot?: string
  }>
}

export default async function NewAppointmentPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user') {
    redirect('/dashboard')
  }

  const slotId = params.slot

  if (!slotId) {
    redirect('/company/schedule?message=Please select a time slot')
  }

  // 空き枠情報を取得
  const { data: slot } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists (
        users (
          full_name
        )
      ),
      service_menus (
        name,
        duration_minutes,
        price
      )
    `)
    .eq('id', slotId)
    .eq('status', 'available')
    .single()

  if (!slot) {
    redirect('/company/schedule?message=Slot not available')
  }

  // 症状マスター一覧を取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  const startTime = new Date(slot.start_time)
  const endTime = new Date(slot.end_time)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約申込</h1>

        {/* 選択した空き枠の情報 */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-blue-900">選択した枠</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <span className="font-medium">日時:</span>{' '}
              {startTime.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}{' '}
              {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              {' 〜 '}
              {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p>
              <span className="font-medium">整体師:</span> {slot.therapists.users.full_name}
            </p>
            <p>
              <span className="font-medium">メニュー:</span> {slot.service_menus.name}（
              {slot.service_menus.duration_minutes}分）
            </p>
            <p>
              <span className="font-medium">料金:</span> ¥
              {slot.service_menus.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 予約申込フォーム */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <form action={createAppointment}>
            <input type="hidden" name="slot_id" value={slotId} />

            <div className="mb-4">
              <label htmlFor="employee_name" className="block text-sm font-medium text-gray-700">
                社員名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_name"
                name="employee_name"
                required
                placeholder="山田 太郎"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                社員ID（社員番号） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_id"
                name="employee_id"
                required
                placeholder="EMP-12345"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                ※ 同姓同名の社員を区別するために必要です
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                症状（複数選択可）
              </label>
              <div className="mt-2 space-y-2">
                {symptoms?.map((symptom) => (
                  <label key={symptom.id} className="flex items-center">
                    <input
                      type="checkbox"
                      name="symptoms"
                      value={symptom.name}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{symptom.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                要望・特記事項
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="例: 長時間のデスクワークによる肩こりがひどいです。"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="rounded-md bg-yellow-50 p-4">
              <h3 className="text-sm font-semibold text-yellow-900">ご確認ください</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                <li>• 申込後、整体師の承認をお待ちください</li>
                <li>• キャンセルは前日20時まで可能です</li>
                <li>• 承認されるまで、この時間枠はロックされます</li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <Link
                href="/company/schedule"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                申込
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
- [ ] `src/app/(protected)/company/appointments/actions.ts`を作成
- [ ] `createAppointment` - 予約申込を実装
- [ ] 楽観的ロックでstatus更新

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'company_user' || !userProfile.company_id) {
    redirect('/dashboard')
  }

  const slotId = formData.get('slot_id') as string
  const employeeName = formData.get('employee_name') as string
  const employeeId = formData.get('employee_id') as string
  const notes = formData.get('notes') as string

  // 症状の取得（複数選択）
  const symptomsArray = formData.getAll('symptoms') as string[]

  // バリデーション
  if (!slotId || !employeeName || !employeeId) {
    redirect('/company/appointments/new?slot=' + slotId + '&message=Required fields are missing')
  }

  // 空き枠の存在確認とステータスチェック
  const { data: slot, error: slotError } = await supabase
    .from('available_slots')
    .select('status, start_time')
    .eq('id', slotId)
    .single()

  if (slotError || !slot) {
    redirect('/company/schedule?message=Slot not found')
  }

  if (slot.status !== 'available') {
    redirect('/company/schedule?message=Slot is no longer available')
  }

  // 最短予約期間のチェック（3日前まで）
  const startTime = new Date(slot.start_time)
  const threeDaysLater = new Date()
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)

  if (startTime < threeDaysLater) {
    redirect('/company/appointments/new?slot=' + slotId + '&message=Cannot book within 3 days')
  }

  // トランザクション: 空き枠のステータス更新と予約作成
  // 1. 空き枠をpendingに更新（楽観的ロック）
  const { error: updateError } = await supabase
    .from('available_slots')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)
    .eq('status', 'available') // 楽観的ロック: availableの場合のみ更新

  if (updateError) {
    console.error('Slot update error:', updateError)
    redirect('/company/schedule?message=Slot is no longer available')
  }

  // 2. 予約を作成
  const { error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      slot_id: slotId,
      company_id: userProfile.company_id,
      requested_by: user.id,
      employee_name: employeeName.trim(),
      employee_id: employeeId.trim(),
      symptoms: symptomsArray,
      notes: notes || null,
      status: 'pending',
    })

  if (appointmentError) {
    console.error('Appointment creation error:', appointmentError)
    // ロールバック: 空き枠をavailableに戻す
    await supabase
      .from('available_slots')
      .update({
        status: 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', slotId)

    redirect('/company/appointments/new?slot=' + slotId + '&message=Failed to create appointment')
  }

  // TODO: 整体師に通知を送信

  revalidatePath('/company/appointments')
  revalidatePath('/company/schedule')
  redirect('/company/appointments?message=Appointment requested successfully')
}
```

## 完了条件
- [ ] 予約申込ページが表示される
- [ ] 選択した空き枠の情報が表示される
- [ ] 社員名・社員IDが必須入力である
- [ ] 症状を複数選択できる
- [ ] 要望・特記事項を自由記述できる
- [ ] 申込時点で枠がpendingにロックされる
- [ ] 最短予約期間（3日前）のチェックが機能する
- [ ] 既に予約された枠には申込できない
- [ ] 法人担当者以外はアクセスできない

## 注意事項
- 申込時点で枠がロック（status: pending）される
- 楽観的ロックで同時申込を防ぐ
- エラー時はロールバックして枠をavailableに戻す
- 最短予約期間は3日前まで
- 症状は複数選択可能（配列で保存）
- 整体師への通知は別チケット（028）で実装

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015-016: マスターデータ管理機能
- 017-019: 空き枠管理・カレンダー表示機能

## 次のステップ
- 021: 予約承認・拒否機能（整体師）
