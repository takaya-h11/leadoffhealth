# 019: カレンダー表示機能

## 概要
react-big-calendarを使用して、全整体師の空き枠と予約状況をカレンダー形式で表示する機能を実装する。整体師と法人担当者が閲覧可能。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ 空き枠管理機能が実装されている（017-018完了）
- ✅ `available_slots`, `appointments`テーブルが作成されている

## タスク

### 1. react-big-calendarのインストール
```bash
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

### 2. カレンダーコンポーネント作成
- [ ] `src/components/calendar`ディレクトリを作成
- [ ] `src/components/calendar/schedule-calendar.tsx`を作成
- [ ] カレンダーのスタイル設定

**実装内容:**
```typescript
'use client'

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useState } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  ja: ja,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ja }),
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    therapistName: string
    status: 'available' | 'pending' | 'booked' | 'cancelled'
    serviceMenuName: string
    companyName?: string
    employeeName?: string
  }
}

interface ScheduleCalendarProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (slotInfo: { start: Date; end: Date }) => void
}

export function ScheduleCalendar({ events, onEventClick, onSlotClick }: ScheduleCalendarProps) {
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())

  const eventStyleGetter = (event: CalendarEvent) => {
    const { status } = event.resource

    let backgroundColor = '#10b981' // green - available
    if (status === 'pending') backgroundColor = '#f59e0b' // yellow - pending
    if (status === 'booked') backgroundColor = '#3b82f6' // blue - booked
    if (status === 'cancelled') backgroundColor = '#6b7280' // gray - cancelled

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }

  return (
    <div className="h-[800px] rounded-lg border border-gray-200 bg-white p-4 shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onEventClick}
        onSelectSlot={onSlotClick}
        selectable
        messages={{
          next: '次へ',
          previous: '前へ',
          today: '今日',
          month: '月',
          week: '週',
          day: '日',
          agenda: '予定',
          date: '日付',
          time: '時間',
          event: 'イベント',
          noEventsInRange: 'この期間にイベントはありません',
          showMore: (total) => `+${total} 件`,
        }}
        formats={{
          monthHeaderFormat: 'yyyy年MM月',
          dayHeaderFormat: 'MM月dd日 (EEE)',
          dayRangeHeaderFormat: ({ start, end }) =>
            `${format(start, 'yyyy年MM月dd日')} - ${format(end, 'MM月dd日')}`,
        }}
      />

      {/* 凡例 */}
      <div className="mt-4 flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded bg-green-500"></div>
          <span>予約可能</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded bg-yellow-500"></div>
          <span>承認待ち</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded bg-blue-500"></div>
          <span>予約確定</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded bg-gray-500"></div>
          <span>キャンセル</span>
        </div>
      </div>
    </div>
  )
}
```

### 3. 整体師用スケジュールページ作成
- [ ] `src/app/(protected)/therapist/schedule/page.tsx`を作成
- [ ] 全整体師の空き枠と予約を表示

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleCalendar } from '@/components/calendar/schedule-calendar'

export default async function TherapistSchedulePage() {
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

  // 全整体師の空き枠と予約を取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists (
        id,
        users (
          full_name
        )
      ),
      service_menus (
        name
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
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')

  // カレンダーイベント形式に変換
  const events = slots?.map((slot) => {
    const appointment = slot.appointments

    let title = `${slot.therapists.users.full_name} - ${slot.service_menus.name}`
    if (appointment && slot.status !== 'available') {
      title = `${slot.therapists.users.full_name} - ${appointment.companies.name} (${appointment.employee_name})`
    }

    return {
      id: slot.id,
      title,
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      resource: {
        therapistName: slot.therapists.users.full_name,
        status: slot.status,
        serviceMenuName: slot.service_menus.name,
        companyName: appointment?.companies.name,
        employeeName: appointment?.employee_name,
      },
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">全体スケジュール</h1>
        <ScheduleCalendar events={events} />
      </div>
    </div>
  )
}
```

### 4. 法人担当者用カレンダーページ作成
- [ ] `src/app/(protected)/company/schedule/page.tsx`を作成
- [ ] 予約可能な空き枠のみ表示
- [ ] 空き枠クリックで予約申込ページへ遷移

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ScheduleCalendarClient } from './schedule-calendar-client'

export default async function CompanySchedulePage() {
  const supabase = await createClient()

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

  // 予約可能な空き枠のみ取得（今後3ヶ月分）
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  const { data: slots } = await supabase
    .from('available_slots')
    .select(`
      *,
      therapists (
        id,
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
    .eq('status', 'available')
    .gte('start_time', new Date().toISOString())
    .lte('start_time', threeMonthsLater.toISOString())
    .order('start_time')

  // カレンダーイベント形式に変換
  const events = slots?.map((slot) => ({
    id: slot.id,
    title: `${slot.therapists.users.full_name} - ${slot.service_menus.name}`,
    start: new Date(slot.start_time),
    end: new Date(slot.end_time),
    resource: {
      therapistName: slot.therapists.users.full_name,
      status: slot.status,
      serviceMenuName: slot.service_menus.name,
      price: slot.service_menus.price,
    },
  })) || []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約可能な空き枠</h1>
        <ScheduleCalendarClient events={events} />
      </div>
    </div>
  )
}
```

### 5. カスタムスタイルの追加
- [ ] `src/app/globals.css`にカレンダーのカスタムスタイルを追加

**実装内容:**
```css
/* react-big-calendar カスタムスタイル */
.rbc-calendar {
  font-family: var(--font-geist-sans);
}

.rbc-header {
  padding: 10px 0;
  font-weight: 600;
}

.rbc-today {
  background-color: #eff6ff;
}

.rbc-event {
  padding: 2px 5px;
  font-size: 0.875rem;
}

.rbc-event:focus {
  outline: 2px solid #3b82f6;
}
```

## 完了条件
- [ ] カレンダーが月・週・日表示で切り替えられる
- [ ] 整体師は全整体師の空き枠と予約を閲覧できる
- [ ] 法人担当者は予約可能な空き枠のみ閲覧できる
- [ ] ステータスごとに色分けされている
- [ ] イベントをクリックすると詳細が表示される
- [ ] 日本語表示が正しく動作する
- [ ] レスポンシブデザインに対応している

## 注意事項
- react-big-calendarはクライアントコンポーネントとして動作
- データ取得はサーバーコンポーネントで行い、プロップスで渡す
- 大量のイベントがある場合はパフォーマンスに注意
- 過去のイベントも表示可能だが、デフォルトでは今後3ヶ月分のみ取得

## 依存チケット
- 001-010: 基本認証機能
- 011-014: ユーザー管理機能
- 015-016: マスターデータ管理機能
- 017-018: 空き枠管理機能

## 次のステップ
- 020: 予約申込機能（法人担当者）
