import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendReminderEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  // Vercel Cron Jobsからのリクエストか検証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 明日のapproved予約を取得
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(
        `
        id,
        employee_name,
        employee_id,
        requested_by,
        available_slots (
          start_time,
          end_time,
          therapist_id,
          therapists (
            user_id,
            users (
              id,
              full_name,
              email
            )
          ),
          service_menus (
            name
          )
        ),
        companies (
          name
        ),
        users!requested_by (
          id,
          email,
          full_name
        )
      `
      )
      .eq('status', 'approved')
      .gte('available_slots.start_time', tomorrow.toISOString())
      .lt('available_slots.start_time', dayAfterTomorrow.toISOString())

    if (error) {
      console.error('Failed to fetch appointments for reminders:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    let remindersSent = 0

    // リマインド送信
    for (const appointment of appointments || []) {
      try {
        const slot = Array.isArray(appointment.available_slots)
          ? appointment.available_slots[0]
          : appointment.available_slots
        const therapist = Array.isArray(slot?.therapists) ? slot.therapists[0] : slot?.therapists
        const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
        const companyUser = Array.isArray(appointment.users)
          ? appointment.users[0]
          : appointment.users
        const company = Array.isArray(appointment.companies)
          ? appointment.companies[0]
          : appointment.companies

        if (!therapistUser || !companyUser || !slot) {
          console.error('Missing data for appointment:', appointment.id)
          continue
        }

        // 整体師にメール送信
        await sendReminderEmail(therapistUser.email, therapistUser.full_name || '整体師', '整体師', {
          ...appointment,
          companies: company,
          available_slots: {
            ...slot,
            therapists: {
              users: therapistUser,
            },
          },
        })

        // 整体師にアプリ内通知
        await createNotification(
          therapistUser.id,
          'reminder',
          '明日の予約のリマインド',
          `明日 ${new Date(slot.start_time).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })} から ${company?.name || '不明'} - ${appointment.employee_name}様の施術があります`,
          appointment.id
        )

        // 法人担当者にメール送信
        await sendReminderEmail(
          companyUser.email,
          appointment.employee_name,
          '法人担当者',
          {
            ...appointment,
            companies: company,
            available_slots: {
              ...slot,
              therapists: {
                users: therapistUser,
              },
            },
          }
        )

        // 法人担当者にアプリ内通知
        await createNotification(
          companyUser.id,
          'reminder',
          '明日の予約のリマインド',
          `明日 ${new Date(slot.start_time).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })} に ${appointment.employee_name}様の施術予約があります`,
          appointment.id
        )

        remindersSent++
      } catch (notificationError) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, notificationError)
        // エラーがあっても次の予約の処理を続ける
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      totalAppointments: appointments?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error in send-reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
