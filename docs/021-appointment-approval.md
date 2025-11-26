# 021: 予約承認・拒否機能（整体師）

## 概要
整体師が自分宛の予約申込を承認または拒否できる機能を実装する。拒否時は拒否理由の入力が必須で、拒否後は枠がavailableに戻る。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ 空き枠管理機能が実装されている（017-019完了）
- ✅ 予約申込機能が実装されている（020完了）
- ✅ `appointments`, `available_slots`テーブルが作成されている

## タスク

### 1. 承認待ち予約一覧ページ作成
- [ ] `src/app/(protected)/therapist/appointments/page.tsx`を作成
- [ ] 整体師権限チェックを実装
- [ ] 自分宛のpending予約を表示

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalButtons } from './approval-buttons'

export default async function TherapistAppointmentsPage() {
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

  // 自分宛のpending予約を取得
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        start_time,
        end_time,
        service_menus (
          name,
          duration_minutes,
          price
        )
      ),
      companies (
        name
      ),
      users!requested_by (
        full_name,
        email
      )
    `)
    .eq('available_slots.therapist_id', therapistId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">承認待ち予約</h1>
          <p className="mt-2 text-sm text-gray-600">
            {appointments?.length || 0}件の予約が承認待ちです
          </p>
        </div>

        <div className="space-y-4">
          {appointments?.map((appointment) => {
            const slot = appointment.available_slots
            const startTime = new Date(slot.start_time)
            const endTime = new Date(slot.end_time)

            return (
              <div
                key={appointment.id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.companies.name}
                      </h3>
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                        承認待ち
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {startTime.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </span>
                      </div>

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          {appointment.employee_name}（ID: {appointment.employee_id}）
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{slot.service_menus.name}</span>
                      </div>

                      {appointment.symptoms && appointment.symptoms.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">症状:</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {appointment.symptoms.map((symptom: string) => (
                              <span
                                key={symptom}
                                className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">要望・特記事項:</p>
                          <p className="mt-1 text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <ApprovalButtons appointmentId={appointment.id} slotId={appointment.slot_id} />
                </div>
              </div>
            )
          })}
        </div>

        {appointments?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            承認待ちの予約はありません
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2. 承認・拒否ボタンコンポーネント作成
- [ ] `src/app/(protected)/therapist/appointments/approval-buttons.tsx`を作成
- [ ] クライアントコンポーネントとして実装
- [ ] 拒否時は拒否理由入力モーダルを表示

**実装内容:**
```typescript
'use client'

import { useState } from 'react'
import { approveAppointment, rejectAppointment } from './actions'

export function ApprovalButtons({
  appointmentId,
  slotId,
}: {
  appointmentId: string
  slotId: string
}) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectedReason, setRejectedReason] = useState('')

  const handleApprove = async () => {
    if (confirm('この予約を承認しますか?')) {
      await approveAppointment(appointmentId, slotId)
    }
  }

  const handleReject = async () => {
    if (!rejectedReason.trim()) {
      alert('拒否理由を入力してください')
      return
    }
    await rejectAppointment(appointmentId, slotId, rejectedReason)
  }

  if (showRejectModal) {
    return (
      <div className="w-64 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
        <h3 className="mb-2 font-semibold text-gray-900">拒否理由</h3>
        <textarea
          value={rejectedReason}
          onChange={(e) => setRejectedReason(e.target.value)}
          rows={3}
          placeholder="拒否理由を入力してください"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleReject}
            className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
          >
            拒否
          </button>
          <button
            onClick={() => setShowRejectModal(false)}
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-2">
      <button
        onClick={handleApprove}
        className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        承認
      </button>
      <button
        onClick={() => setShowRejectModal(true)}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
      >
        拒否
      </button>
    </div>
  )
}
```

### 3. Server Actions作成
- [ ] `src/app/(protected)/therapist/appointments/actions.ts`を作成
- [ ] `approveAppointment` - 予約承認
- [ ] `rejectAppointment` - 予約拒否

**実装内容:**
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function approveAppointment(appointmentId: string, slotId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist') {
    redirect('/dashboard')
  }

  // 1. 予約をapprovedに更新
  const { error: appointmentError } = await supabase
    .from('appointments')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('status', 'pending') // pendingの場合のみ更新

  if (appointmentError) {
    console.error('Appointment approval error:', appointmentError)
    redirect('/therapist/appointments?message=Failed to approve appointment')
  }

  // 2. 空き枠をbookedに更新
  const { error: slotError } = await supabase
    .from('available_slots')
    .update({
      status: 'booked',
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)

  if (slotError) {
    console.error('Slot update error:', slotError)
  }

  // TODO: 法人担当者に承認通知を送信

  revalidatePath('/therapist/appointments')
  revalidatePath('/therapist/schedule')
  redirect('/therapist/appointments?message=Appointment approved successfully')
}

export async function rejectAppointment(
  appointmentId: string,
  slotId: string,
  rejectedReason: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist') {
    redirect('/dashboard')
  }

  // バリデーション
  if (!rejectedReason || rejectedReason.trim().length === 0) {
    redirect('/therapist/appointments?message=Rejection reason is required')
  }

  // 1. 予約をrejectedに更新
  const { error: appointmentError } = await supabase
    .from('appointments')
    .update({
      status: 'rejected',
      rejected_reason: rejectedReason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('status', 'pending')

  if (appointmentError) {
    console.error('Appointment rejection error:', appointmentError)
    redirect('/therapist/appointments?message=Failed to reject appointment')
  }

  // 2. 空き枠をavailableに戻す
  const { error: slotError } = await supabase
    .from('available_slots')
    .update({
      status: 'available',
      updated_at: new Date().toISOString(),
    })
    .eq('id', slotId)

  if (slotError) {
    console.error('Slot update error:', slotError)
  }

  // TODO: 法人担当者に拒否通知を送信（拒否理由含む）

  revalidatePath('/therapist/appointments')
  revalidatePath('/therapist/schedule')
  redirect('/therapist/appointments?message=Appointment rejected')
}
```

## 完了条件
- [ ] 承認待ち予約一覧が表示される
- [ ] 予約の詳細情報が表示される
- [ ] 予約を承認できる
- [ ] 予約を拒否できる
- [ ] 拒否時に拒否理由の入力が必須
- [ ] 承認後、予約statusがapproved、枠statusがbookedになる
- [ ] 拒否後、予約statusがrejected、枠statusがavailableになる
- [ ] 整体師以外はアクセスできない

## 注意事項
- 承認・拒否に期限なし（いつまでもpending可能）
- 拒否理由は必須入力
- 承認後は枠がbooked（予約確定）
- 拒否後は枠がavailable（再度予約可能）
- 法人担当者への通知は別チケット（028）で実装

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015-016: マスターデータ管理機能
- 017-020: 空き枠管理・予約申込機能

## 次のステップ
- 022: 予約一覧・検索機能
