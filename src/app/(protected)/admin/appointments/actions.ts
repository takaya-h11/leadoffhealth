'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendAppointmentApprovedEmail, sendAppointmentRejectedEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function approveAppointment(appointmentId: string, slotId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  try {
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
      redirect('/admin/appointments?message=error_approval_failed')
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

    // 法人担当者に承認通知を送信
    try {
      const { data: appointmentInfo } = await supabase
        .from('appointments')
        .select(`
          employee_name,
          employee_id,
          requested_by,
          available_slots (
            start_time,
            end_time,
            therapists (
              users (
                full_name
              )
            )
          ),
          users!requested_by (
            email,
            full_name
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (appointmentInfo) {
        const slot = Array.isArray(appointmentInfo.available_slots)
          ? appointmentInfo.available_slots[0]
          : appointmentInfo.available_slots
        const therapist = Array.isArray(slot?.therapists) ? slot.therapists[0] : slot?.therapists
        const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
        const requestedByUser = Array.isArray(appointmentInfo.users)
          ? appointmentInfo.users[0]
          : appointmentInfo.users

        // メール通知を送信
        if (requestedByUser?.email) {
          await sendAppointmentApprovedEmail(
            requestedByUser.email,
            requestedByUser.full_name || '担当者',
            {
              startTime: slot.start_time,
              endTime: slot.end_time,
              companyName: '',
              employeeName: appointmentInfo.employee_name,
              employeeId: appointmentInfo.employee_id,
              symptoms: [],
              therapistName: therapistUser?.full_name || '不明',
            }
          )
        }

        // アプリ内通知を作成
        if (appointmentInfo.requested_by) {
          const startTime = new Date(slot.start_time)
          await createNotification(
            appointmentInfo.requested_by,
            'appointment_approved',
            '予約が承認されました',
            `${therapistUser?.full_name || '整体師'}が${startTime.toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
            })}の予約を承認しました（管理者による代理承認）`,
            appointmentId
          )
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    revalidatePath('/admin/appointments')
    redirect('/admin/appointments?message=success_approved')
  } catch (error) {
    // redirect() throws NEXT_REDIRECT - must re-throw it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Unexpected error:', error)
    redirect('/admin/appointments?message=error_unexpected')
  }
}

export async function rejectAppointment(
  appointmentId: string,
  slotId: string,
  rejectedReason: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // バリデーション
  if (!rejectedReason || rejectedReason.trim().length === 0) {
    redirect('/admin/appointments?message=error_reason_required')
  }

  try {
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
      redirect('/admin/appointments?message=error_rejection_failed')
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

    // 法人担当者に拒否通知を送信
    try {
      const { data: appointmentInfo } = await supabase
        .from('appointments')
        .select(`
          employee_name,
          employee_id,
          requested_by,
          rejected_reason,
          available_slots (
            start_time,
            end_time
          ),
          users!requested_by (
            email,
            full_name
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (appointmentInfo) {
        const slot = Array.isArray(appointmentInfo.available_slots)
          ? appointmentInfo.available_slots[0]
          : appointmentInfo.available_slots
        const requestedByUser = Array.isArray(appointmentInfo.users)
          ? appointmentInfo.users[0]
          : appointmentInfo.users

        // メール通知を送信
        if (requestedByUser?.email) {
          await sendAppointmentRejectedEmail(
            requestedByUser.email,
            requestedByUser.full_name || '担当者',
            {
              startTime: slot.start_time,
              endTime: slot.end_time,
              companyName: '',
              employeeName: appointmentInfo.employee_name,
              employeeId: appointmentInfo.employee_id,
              symptoms: [],
              rejectedReason: appointmentInfo.rejected_reason || '理由が記載されていません',
            }
          )
        }

        // アプリ内通知を作成
        if (appointmentInfo.requested_by) {
          const startTime = new Date(slot.start_time)
          await createNotification(
            appointmentInfo.requested_by,
            'appointment_rejected',
            '予約が拒否されました',
            `${startTime.toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
            })}の予約が拒否されました（管理者による代理操作）。理由: ${appointmentInfo.rejected_reason || '記載なし'}`,
            appointmentId
          )
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
    }

    revalidatePath('/admin/appointments')
    redirect('/admin/appointments?message=success_rejected')
  } catch (error) {
    // redirect() throws NEXT_REDIRECT - must re-throw it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    console.error('Unexpected error:', error)
    redirect('/admin/appointments?message=error_unexpected')
  }
}
