# 018: 空き枠一覧・削除機能（整体師）

## 概要
整体師が自分の登録した空き枠を一覧表示し、予約が入っていない枠を削除できる機能を実装する。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ 空き枠登録機能が実装されている（017完了）
- ✅ `available_slots`テーブルが作成されている

## タスク

### 1. 空き枠一覧ページ作成
- [ ] `src/app/(protected)/therapist/slots/page.tsx`を作成
- [ ] 整体師権限チェックを実装
- [ ] 自分の空き枠一覧を表示
- [ ] ステータス別フィルタリング機能を追加

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DeleteSlotButton } from './delete-slot-button'

interface PageProps {
  searchParams: Promise<{
    status?: string
    from?: string
    to?: string
  }>
}

export default async function TherapistSlotsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

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

  const therapistId = userProfile.therapists?.[0]?.id

  // クエリビルダー
  let query = supabase
    .from('available_slots')
    .select(`
      *,
      service_menus (
        id,
        name,
        duration_minutes,
        price
      ),
      appointments (
        id,
        status,
        employee_name,
        companies (
          name
        )
      )
    `)
    .eq('therapist_id', therapistId)

  // ステータスでフィルター
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // 日付範囲でフィルター
  if (params.from) {
    query = query.gte('start_time', params.from)
  }
  if (params.to) {
    query = query.lte('start_time', params.to)
  }

  const { data: slots } = await query.order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">空き枠管理</h1>
          <Link
            href="/therapist/slots/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            新規空き枠登録
          </Link>
        </div>

        {/* フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="available">予約可能</option>
                <option value="pending">承認待ち</option>
                <option value="booked">予約確定</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>

            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                開始日
              </label>
              <input
                type="date"
                id="from"
                name="from"
                defaultValue={params.from}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                終了日
              </label>
              <input
                type="date"
                id="to"
                name="to"
                defaultValue={params.to}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end md:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                検索
              </button>
              <Link
                href="/therapist/slots"
                className="ml-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {/* 空き枠一覧 */}
        <div className="space-y-4">
          {slots?.map((slot) => {
            const startTime = new Date(slot.start_time)
            const endTime = new Date(slot.end_time)
            const isPast = startTime < new Date()
            const canDelete = slot.status === 'available' && !isPast

            return (
              <div
                key={slot.id}
                className={`rounded-lg border p-6 shadow ${
                  slot.status === 'available'
                    ? 'border-green-200 bg-green-50'
                    : slot.status === 'pending'
                    ? 'border-yellow-200 bg-yellow-50'
                    : slot.status === 'booked'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {startTime.toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          slot.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : slot.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : slot.status === 'booked'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {slot.status === 'available'
                          ? '予約可能'
                          : slot.status === 'pending'
                          ? '承認待ち'
                          : slot.status === 'booked'
                          ? '予約確定'
                          : 'キャンセル'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                          {' 〜 '}
                          {endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{slot.service_menus?.name}</span>
                      </div>

                      {slot.appointments && (
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>
                            {slot.appointments.companies?.name} - {slot.appointments.employee_name}様
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {canDelete && (
                      <DeleteSlotButton slotId={slot.id} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {slots?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            該当する空き枠がありません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 削除ボタンコンポーネント作成
- [ ] `src/app/(protected)/therapist/slots/delete-slot-button.tsx`を作成
- [ ] クライアントコンポーネントとして実装
- [ ] 削除確認ダイアログを表示

**実装内容:**
```typescript
'use client'

import { deleteAvailableSlot } from './actions'
import { useState } from 'react'

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    await deleteAvailableSlot(slotId)
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-gray-700">本当に削除しますか?</p>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          >
            削除
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    >
      削除
    </button>
  )
}
```

### 3. Server Actions更新
- [ ] `deleteAvailableSlot` - 空き枠削除を追加

**実装内容:**
```typescript
export async function deleteAvailableSlot(slotId: string) {
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

  const therapistId = userProfile.therapists?.[0]?.id

  // 空き枠の所有者チェックとステータス確認
  const { data: slot } = await supabase
    .from('available_slots')
    .select('therapist_id, status')
    .eq('id', slotId)
    .single()

  if (!slot || slot.therapist_id !== therapistId) {
    redirect('/therapist/slots?message=Unauthorized')
  }

  if (slot.status !== 'available') {
    redirect('/therapist/slots?message=Cannot delete slot with appointments')
  }

  // 削除（物理削除）
  const { error } = await supabase
    .from('available_slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    console.error('Slot deletion error:', error)
    redirect('/therapist/slots?message=Failed to delete slot')
  }

  revalidatePath('/therapist/slots')
  revalidatePath('/therapist/schedule')
  redirect('/therapist/slots?message=Slot deleted successfully')
}
```

## 完了条件
- [ ] 空き枠一覧ページが表示される
- [ ] ステータス別にフィルタリングできる
- [ ] 日付範囲でフィルタリングできる
- [ ] 予約可能（available）な枠のみ削除ボタンが表示される
- [ ] 削除前に確認ダイアログが表示される
- [ ] 削除に成功すると一覧が更新される
- [ ] 他の整体師の枠は削除できない
- [ ] 整体師以外はアクセスできない

## 注意事項
- 予約が入っている枠（pending/booked/cancelled）は削除不可
- 過去の枠も削除不可
- 削除は物理削除（データベースから完全に削除）
- 自分の枠のみ削除可能（他の整体師の枠は削除不可）

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015-016: マスターデータ管理機能
- 017: 空き枠登録機能

## 次のステップ
- 019: カレンダー表示機能（react-big-calendar）
