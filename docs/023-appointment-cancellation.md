# 023: 予約キャンセル機能

## 概要
法人担当者または管理者が予約をキャンセルできる機能を実装する。キャンセル期限は前日20時までで、キャンセル後は枠がavailableに戻る。

## 前提条件
- ✅ 予約管理機能が実装されている（017-022完了）

## タスク

### 1. キャンセルボタンコンポーネント作成
```typescript
'use client'

import { cancelAppointment } from './actions'

export function CancelButton({ appointmentId, slotId, deadline }: {
  appointmentId: string
  slotId: string
  deadline: Date
}) {
  const canCancel = new Date() < deadline

  const handleCancel = async () => {
    if (confirm('この予約をキャンセルしますか?')) {
      await cancelAppointment(appointmentId, slotId)
    }
  }

  if (!canCancel) {
    return (
      <p className="text-sm text-gray-500">キャンセル期限を過ぎています</p>
    )
  }

  return (
    <button
      onClick={handleCancel}
      className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      キャンセル
    </button>
  )
}
```

### 2. Server Actions作成
```typescript
'use server'

export async function cancelAppointment(appointmentId: string, slotId: string) {
  const supabase = await createClient()

  // キャンセル期限チェック（前日20時）
  const { data: appointment } = await supabase
    .from('appointments')
    .select('available_slots(start_time)')
    .eq('id', appointmentId)
    .single()

  const startTime = new Date(appointment.available_slots.start_time)
  const deadline = new Date(startTime)
  deadline.setDate(deadline.getDate() - 1)
  deadline.setHours(20, 0, 0, 0)

  if (new Date() > deadline) {
    redirect('?message=Cannot cancel after deadline')
  }

  // 予約をcancelledに更新
  await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq('id', appointmentId)

  // 空き枠をavailableに戻す
  await supabase
    .from('available_slots')
    .update({ status: 'available' })
    .eq('id', slotId)

  revalidatePath('/company/appointments')
  redirect('?message=Appointment cancelled successfully')
}
```

## 完了条件
- [ ] 前日20時までキャンセル可能
- [ ] キャンセル後、枠がavailableに戻る
- [ ] キャンセル日時と実行者が記録される

## 依存チケット
- 017-022: 予約管理機能

## 次のステップ
- 024: 予約ステータス管理機能
