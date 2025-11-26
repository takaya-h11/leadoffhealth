'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleCalendar } from '@/components/calendar/schedule-calendar'
import { AddSlotDialog } from '@/components/therapist/add-slot-dialog'
import { EditSlotDialog } from '@/components/therapist/edit-slot-dialog'

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

interface ServiceMenu {
  id: string
  name: string
  duration_minutes: number
}

interface AdminScheduleClientProps {
  events: CalendarEvent[]
  serviceMenus: ServiceMenu[]
}

export function AdminScheduleClient({ events, serviceMenus }: AdminScheduleClientProps) {
  const router = useRouter()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const handleSlotClick = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo)
    setIsAddDialogOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEditDialogOpen(true)
  }

  const handleAddSlot = async (data: {
    service_menu_id: string
    start_time: string
    end_time: string
  }) => {
    const response = await fetch('/api/available-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '登録に失敗しました')
    }

    // 成功したらページをリロード
    router.refresh()
  }

  const handleUpdateSlot = async (
    id: string,
    data: {
      service_menu_id: string
      start_time: string
      end_time: string
    }
  ) => {
    const response = await fetch(`/api/available-slots/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '更新に失敗しました')
    }

    // 成功したらページをリロード
    router.refresh()
  }

  const handleDeleteSlot = async (id: string) => {
    const response = await fetch(`/api/available-slots/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '削除に失敗しました')
    }

    // 成功したらページをリロード
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">全体スケジュール</h1>
          <button
            onClick={() => {
              setSelectedSlot(null)
              setIsAddDialogOpen(true)
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + 空き枠を登録
          </button>
        </div>

        <div className="mb-4 rounded-md bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>ヒント:</strong> カレンダー上の空白部分をクリックで空き枠を登録、既存の枠をクリックで詳細表示・編集できます。
          </p>
        </div>

        <ScheduleCalendar
          events={events}
          onSlotClick={handleSlotClick}
          onEventClick={handleEventClick}
        />

        <AddSlotDialog
          isOpen={isAddDialogOpen}
          initialStartTime={selectedSlot?.start}
          initialEndTime={selectedSlot?.end}
          serviceMenus={serviceMenus}
          onClose={() => {
            setIsAddDialogOpen(false)
            setSelectedSlot(null)
          }}
          onSubmit={handleAddSlot}
        />

        <EditSlotDialog
          isOpen={isEditDialogOpen}
          event={selectedEvent}
          serviceMenus={serviceMenus}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedEvent(null)
          }}
          onUpdate={handleUpdateSlot}
          onDelete={handleDeleteSlot}
        />
      </div>
    </div>
  )
}
