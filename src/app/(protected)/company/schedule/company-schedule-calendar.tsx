'use client'

import { useRouter } from 'next/navigation'
import { ScheduleCalendar } from '@/components/calendar/schedule-calendar'

interface CalendarEvent {
  id: string
  slotId?: string // 予約用の元のslot ID
  title: string
  start: Date
  end: Date
  resource: {
    therapistName: string
    status: 'available' | 'pending' | 'booked' | 'cancelled'
    serviceMenuName: string
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

  const handleEventClick = (event: CalendarEvent) => {
    // 予約可能な空き枠のみクリック可能
    if (event.resource.status === 'available' && event.slotId) {
      const path = bookingPath
        ? `${bookingPath}?slot=${event.slotId}`
        : `/company/appointments/new?slot=${event.slotId}`
      router.push(path)
    }
  }

  return <ScheduleCalendar events={events} onEventClick={handleEventClick} />
}
