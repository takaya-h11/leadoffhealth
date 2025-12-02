'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendAppointmentRequestEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 権限チェック（法人担当者または管理者）
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  // 管理者からの予約かどうか
  const isAdminBooking = formData.get('admin_booking') === 'true'
  const specifiedCompanyId = formData.get('company_id') as string

  let companyId: string

  if (userProfile?.role === 'admin' && isAdminBooking && specifiedCompanyId) {
    // 管理者が法人を指定して予約
    companyId = specifiedCompanyId
  } else if (userProfile?.role === 'company_user' && userProfile.company_id) {
    // 法人担当者が自社の予約
    companyId = userProfile.company_id
  } else {
    redirect('/dashboard')
  }

  const slotId = formData.get('slot_id') as string
  const employeeName = formData.get('employee_name') as string
  const employeeId = formData.get('employee_id') as string
  const notes = formData.get('notes') as string

  // 症状の取得（複数選択）
  const symptomsArray = formData.getAll('symptoms') as string[]

  // リダイレクトパスの決定
  const redirectBasePath = isAdminBooking ? `/admin/book/${companyId}` : '/company/appointments'

  // バリデーション
  if (!slotId || !employeeName || !employeeId) {
    redirect(`${redirectBasePath}/new?slot=${slotId}&message=${encodeURIComponent('必須項目が入力されていません')}`)
  }

  // 空き枠の存在確認とステータスチェック
  const { data: slot, error: slotError } = await supabase
    .from('available_slots')
    .select('status, start_time')
    .eq('id', slotId)
    .single()

  const scheduleBasePath = isAdminBooking ? `/admin/book/${companyId}` : '/company/schedule'

  if (slotError || !slot) {
    redirect(`${scheduleBasePath}?message=${encodeURIComponent('空き枠が見つかりません')}`)
  }

  if (slot.status !== 'available') {
    redirect(`${scheduleBasePath}?message=${encodeURIComponent('この枠は既に予約されています')}`)
  }

  // 最短予約期間のチェック（3日前まで）
  const startTime = new Date(slot.start_time)
  const threeDaysLater = new Date()
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)

  if (startTime < threeDaysLater) {
    redirect(`${redirectBasePath}/new?slot=${slotId}&message=${encodeURIComponent('予約は3日前までに行ってください')}`)
  }

  try {
    // 既存の予約をチェック（重複防止）
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_id', slotId)
      .maybeSingle()

    if (existingAppointment) {
      console.log('Appointment already exists for slot:', slotId)
      redirect(`${scheduleBasePath}?message=${encodeURIComponent('この枠は既に予約されています')}`)
    }

    // トランザクション: 空き枠のステータス更新と予約作成
    // 1. 空き枠をpendingに更新（楽観的ロック）
    const { error: updateError } = await supabase
      .from('available_slots')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', slotId)
      .eq('status', 'available') // 楽観的ロック: availableの場合のみ更新

    if (updateError) {
      console.error('Slot update error:', updateError)
      redirect(`${scheduleBasePath}?message=${encodeURIComponent('この枠は既に予約されています')}`)
    }

    // 2. 予約を作成
    const { error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        slot_id: slotId,
        company_id: companyId,
        requested_by: user.id,
        employee_name: employeeName.trim(),
        employee_id: employeeId.trim(),
        symptoms: symptomsArray,
        notes: notes || null,
        status: 'pending',
      })

    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError)

      // 重複エラーの場合は特別なメッセージ
      if (appointmentError.code === '23505') {
        redirect(`${scheduleBasePath}?message=${encodeURIComponent('この枠は既に予約されています')}`)
      }

      // ロールバック: 空き枠をavailableに戻す
      await supabase
        .from('available_slots')
        .update({
          status: 'available',
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId)

      redirect(`${redirectBasePath}/new?slot=${slotId}&message=${encodeURIComponent('予約の作成に失敗しました')}`)
    }

    // 作成された予約IDを取得
    const { data: createdAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('slot_id', slotId)
      .eq('company_id', companyId)
      .single()

    // 整体師に通知を送信
    try {
      // 整体師情報を取得
      const { data: slotInfo } = await supabase
        .from('available_slots')
        .select(`
          start_time,
          end_time,
          therapist_id,
          therapists (
            user_id,
            users (
              email,
              full_name
            )
          )
        `)
        .eq('id', slotId)
        .single()

      // 法人情報を取得
      const { data: companyInfo } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

      if (slotInfo && companyInfo) {
        const therapist = Array.isArray(slotInfo.therapists) ? slotInfo.therapists[0] : slotInfo.therapists
        const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users

        // メール通知を送信
        if (therapistUser?.email) {
          await sendAppointmentRequestEmail(
            therapistUser.email,
            therapistUser.full_name || '整体師',
            {
              startTime: slotInfo.start_time,
              endTime: slotInfo.end_time,
              companyName: companyInfo.name,
              employeeName: employeeName.trim(),
              employeeId: employeeId.trim(),
              symptoms: symptomsArray,
              notes: notes || undefined,
            }
          )
        }

        // アプリ内通知を作成
        if (therapist?.user_id) {
          const startTime = new Date(slotInfo.start_time)
          await createNotification(
            therapist.user_id,
            'appointment_requested',
            '新しい予約申込',
            `${companyInfo.name}から${startTime.toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
            })}の予約申込が届きました`,
            createdAppointment?.id
          )
        }
      }
    } catch (emailError) {
      console.error('Failed to send notification:', emailError)
      // 通知エラーは記録するが、予約処理は継続
    }

    revalidatePath('/company/appointments')
    revalidatePath('/company/schedule')
    revalidatePath('/admin/appointments')
    revalidatePath(`/admin/book/${companyId}`)

    const successPath = isAdminBooking
      ? `/admin/appointments?message=${encodeURIComponent('success: 予約を申し込みました')}`
      : `/company/appointments?message=${encodeURIComponent('success: 予約を申し込みました')}`

    redirect(successPath)
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error in createAppointment:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    redirect(`${redirectBasePath}/new?slot=${slotId}&message=${encodeURIComponent('予期しないエラーが発生しました')}`)
  }
}

export async function cancelAppointment(appointmentId: string, slotId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 法人担当者または管理者権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!userProfile || (userProfile.role !== 'company_user' && userProfile.role !== 'admin')) {
    redirect('/dashboard')
  }

  // 予約情報の取得
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        start_time
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (fetchError || !appointment) {
    redirect('/company/appointments?message=' + encodeURIComponent('予約が見つかりません'))
  }

  // 法人担当者の場合、自社の予約のみキャンセル可能
  if (userProfile.role === 'company_user' && appointment.company_id !== userProfile.company_id) {
    redirect('/company/appointments?message=' + encodeURIComponent('この予約をキャンセルする権限がありません'))
  }

  // ステータスチェック（pending または approved のみキャンセル可能）
  if (appointment.status !== 'pending' && appointment.status !== 'approved') {
    redirect('/company/appointments?message=' + encodeURIComponent('この予約はキャンセルできません'))
  }

  // キャンセル期限チェック（前日20時）
  const slot = Array.isArray(appointment.available_slots)
    ? appointment.available_slots[0]
    : appointment.available_slots
  const startTime = new Date(slot.start_time)
  const deadline = new Date(startTime)
  deadline.setDate(deadline.getDate() - 1)
  deadline.setHours(20, 0, 0, 0)

  const now = new Date()
  if (now > deadline) {
    redirect('/company/appointments?message=' + encodeURIComponent('キャンセル期限（前日20時）を過ぎています'))
  }

  try {
    // 1. 予約をcancelledに更新
    const { error: appointmentError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (appointmentError) {
      console.error('Appointment cancellation error:', appointmentError)
      redirect('/company/appointments?message=' + encodeURIComponent('キャンセルに失敗しました'))
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

    // 整体師にキャンセル通知を送信
    try {
      // 整体師情報と法人情報を取得
      const { data: slotInfo, error: slotInfoError } = await supabase
        .from('available_slots')
        .select(`
          start_time,
          therapist_id,
          therapists (
            user_id,
            users (
              id,
              email,
              full_name
            )
          )
        `)
        .eq('id', slotId)
        .single()

      if (slotInfoError) {
        console.error('Failed to fetch slot info for cancellation notification:', slotInfoError)
      }

      const { data: companyInfo, error: companyInfoError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', appointment.company_id)
        .single()

      if (companyInfoError) {
        console.error('Failed to fetch company info for cancellation notification:', companyInfoError)
      }

      if (slotInfo && companyInfo) {
        const therapist = Array.isArray(slotInfo.therapists) ? slotInfo.therapists[0] : slotInfo.therapists
        const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users

        // アプリ内通知を作成
        if (therapistUser?.id) {
          const startTime = new Date(slotInfo.start_time)
          await createNotification(
            therapistUser.id,
            'appointment_cancelled',
            '予約がキャンセルされました',
            `${companyInfo.name}の${startTime.toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
            })} ${startTime.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}の予約がキャンセルされました（社員: ${appointment.employee_name}様）`,
            appointmentId
          )
        } else {
          console.error('Therapist user ID not found in slot info')
        }
      } else {
        console.error('Missing slot info or company info for cancellation notification')
      }
    } catch (notificationError) {
      console.error('Failed to send cancellation notification:', notificationError)
      // 通知エラーは記録するが、キャンセル処理は継続
    }

    revalidatePath('/company/appointments')
    revalidatePath('/company/schedule')
    revalidatePath('/therapist/schedule')
    redirect('/company/appointments?message=' + encodeURIComponent('success: 予約をキャンセルしました'))
  } catch (error) {
    // redirect()は内部的にNEXT_REDIRECT例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect('/company/appointments?message=' + encodeURIComponent('予期しないエラーが発生しました'))
  }
}
