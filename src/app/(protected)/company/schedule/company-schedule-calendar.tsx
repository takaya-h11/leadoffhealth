'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScheduleCalendar } from '@/components/calendar/schedule-calendar'
import { CompanyAppointmentDialog } from './company-appointment-dialog'

interface CalendarEvent {
  id: string
  slotId?: string
  appointmentId?: string
  title: string
  start: Date
  end: Date
  resource: {
    therapistName: string
    status: 'available' | 'my_booking' | 'company_booking' | 'other_booking'
    serviceMenuName: string
    companyName?: string
    userName?: string
    price?: number
    durationMinutes?: number
  }
}

interface CompanyScheduleCalendarProps {
  events: CalendarEvent[]
  bookingPath?: string
}

export function CompanyScheduleCalendar({ events, bookingPath }: CompanyScheduleCalendarProps) {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEventClick = (event: CalendarEvent) => {
    // 予約可能な空き枠 → 予約画面へ
    if (event.resource.status === 'available' && event.slotId) {
      const path = bookingPath
        ? `${bookingPath}?slot=${event.slotId}`
        : `/company/appointments/new?slot=${event.slotId}`
      router.push(path)
    }
    // 自分の予約または自社の予約 → 詳細ダイアログを表示
    else if ((event.resource.status === 'my_booking' || event.resource.status === 'company_booking') && event.resource.userName) {
      setSelectedEvent(event)
      setIsDialogOpen(true)
    }
  }

  const handleCancelAppointment = async (appointmentId: string, slotId: string) => {
    const { cancelAppointment } = await import('@/app/(protected)/company/appointments/actions')
    await cancelAppointment(appointmentId, slotId)
    router.refresh()
  }

  return (
    <>
      <ScheduleCalendar events={events} onEventClick={handleEventClick} />

      <CompanyAppointmentDialog
        isOpen={isDialogOpen}
        event={selectedEvent}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedEvent(null)
        }}
        onCancelAppointment={handleCancelAppointment}
      />
    </>
  )
}
