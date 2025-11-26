# 029: アプリ内通知機能

## 概要
notificationsテーブルを使用してアプリ内通知を実装する。予約申込・承認・拒否時に通知を作成し、ヘッダーに未読バッジを表示する。

## 前提条件
- ✅ 予約管理機能が実装されている（017-024完了）
- ✅ `notifications`テーブルが作成されている

## タスク

### 1. 通知作成ヘルパー関数
```typescript
// src/lib/notifications.ts
import { createClient } from '@/utils/supabase/server'

export async function createNotification(
  userId: string,
  type: 'appointment_requested' | 'appointment_approved' | 'appointment_rejected' | 'reminder',
  title: string,
  message: string,
  appointmentId?: string
) {
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      appointment_id: appointmentId,
      is_read: false,
    })
}
```

### 2. 未読通知数の取得
```typescript
export async function getUnreadNotificationsCount(userId: string) {
  const supabase = await createClient()

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count || 0
}
```

### 3. 通知ドロップダウンコンポーネント
```typescript
// src/components/notifications-dropdown.tsx
'use client'

import { useState, useEffect } from 'react'

export function NotificationsDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    const data = await res.json()
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
    fetchNotifications()
  }

  return (
    <div className="relative">
      <button className="relative">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウンメニュー */}
      <div className="absolute right-0 mt-2 w-80 rounded-md bg-white shadow-lg">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`border-b p-4 ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}
            onClick={() => markAsRead(n.id)}
          >
            <h4 className="font-semibold">{n.title}</h4>
            <p className="text-sm text-gray-600">{n.message}</p>
            <p className="text-xs text-gray-400">
              {new Date(n.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Server Actionsに統合
```typescript
// 予約申込時
await createAppointment(formData)
await createNotification(
  therapistUserId,
  'appointment_requested',
  '新しい予約申込',
  `${companyName}から新しい予約申込が届きました`,
  appointmentId
)

// 承認時
await approveAppointment(appointmentId)
await createNotification(
  requestedByUserId,
  'appointment_approved',
  '予約が承認されました',
  `${therapistName}が予約を承認しました`,
  appointmentId
)

// 拒否時
await rejectAppointment(appointmentId, reason)
await createNotification(
  requestedByUserId,
  'appointment_rejected',
  '予約が拒否されました',
  `理由: ${reason}`,
  appointmentId
)
```

## 完了条件
- [ ] 予約申込時に整体師に通知作成
- [ ] 承認・拒否時に法人担当者に通知作成
- [ ] ヘッダーに未読通知数バッジを表示
- [ ] 通知をクリックすると既読になる
- [ ] 通知をクリックすると関連ページに遷移

## 依存チケット
- 017-024: 予約管理機能

## 次のステップ
- 030: リマインド通知機能
