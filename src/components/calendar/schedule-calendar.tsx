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
      <style jsx global>{`
        /* Agendaビューのテーブル全体 */
        .rbc-agenda-view {
          overflow-x: auto;
        }

        .rbc-agenda-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        /* Agendaビューの行レイアウトを強制 */
        .rbc-agenda-table tbody > tr {
          display: table-row !important;
        }

        /* テーブルヘッダー */
        .rbc-agenda-table thead > tr > th {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 2px solid #ddd;
          background-color: #f3f4f6;
          font-weight: 600;
          color: #1f2937;
        }

        /* 日付列のヘッダー */
        .rbc-agenda-table thead > tr > th:first-child {
          width: 180px;
        }

        /* 時間列のヘッダー */
        .rbc-agenda-table thead > tr > th:nth-child(2) {
          width: 140px;
        }

        /* イベント列のヘッダー */
        .rbc-agenda-table thead > tr > th:nth-child(3) {
          width: auto;
        }

        /* テーブルボディのセル - 共通スタイル */
        .rbc-agenda-table tbody > tr > td {
          padding: 12px;
          vertical-align: top;
          border-bottom: 1px solid #e5e7eb;
          display: table-cell !important;
        }

        /* 日付列 - rowspanあり */
        .rbc-agenda-date-cell {
          width: 180px;
          background-color: #f9fafb !important;
          font-weight: 600;
          color: #1f2937 !important;
          vertical-align: middle;
          border-right: 2px solid #e5e7eb;
        }

        /* 時間列 */
        .rbc-agenda-time-cell {
          width: 140px;
          white-space: nowrap;
          color: #4b5563 !important;
          font-weight: 500;
          background-color: white !important;
        }

        /* イベント列 */
        .rbc-agenda-event-cell {
          padding-left: 16px;
          color: #374151 !important;
          background-color: white !important;
        }

        /* 行のホバー効果 */
        .rbc-agenda-table tbody > tr:hover > td {
          background-color: #f9fafb !important;
        }

        /* 日付セルはホバー時も背景色を維持 */
        .rbc-agenda-table tbody > tr:hover > td.rbc-agenda-date-cell {
          background-color: #f3f4f6 !important;
        }
      `}</style>
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
        step={15}
        timeslots={4}
        defaultDate={new Date()}
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
          dayHeaderFormat: (date: Date) => format(date, 'MM月dd日 (EEEE)', { locale: ja }),
          dayRangeHeaderFormat: ({ start, end }) =>
            `${format(start, 'yyyy年MM月dd日', { locale: ja })} - ${format(end, 'MM月dd日', { locale: ja })}`,
          weekdayFormat: (date: Date) => format(date, 'EEEEE', { locale: ja }),
          timeGutterFormat: (date: Date) => format(date, 'HH:mm', { locale: ja }),
          eventTimeRangeFormat: ({ start, end }) =>
            `${format(start, 'HH:mm', { locale: ja })} - ${format(end, 'HH:mm', { locale: ja })}`,
          agendaTimeFormat: (date: Date) => format(date, 'HH:mm', { locale: ja }),
          agendaTimeRangeFormat: ({ start, end }) =>
            `${format(start, 'HH:mm', { locale: ja })} - ${format(end, 'HH:mm', { locale: ja })}`,
          agendaHeaderFormat: ({ start, end }) =>
            `${format(start, 'yyyy年MM月dd日', { locale: ja })} - ${format(end, 'MM月dd日', { locale: ja })}`,
          agendaDateFormat: (date: Date) => format(date, 'MM月dd日 (EEEE)', { locale: ja }),
          dayFormat: (date: Date) => format(date, 'dd EEEEE', { locale: ja }),
          dateFormat: (date: Date) => format(date, 'dd', { locale: ja }),
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
