'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendTreatmentCompletedEmail } from '@/lib/email'

export async function updateTreatmentRecord(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const recordId = formData.get('record_id') as string
  const treatmentContent = formData.get('treatment_content') as string
  const patientCondition = formData.get('patient_condition') as string
  const improvementLevel = formData.get('improvement_level') as string
  const satisfactionLevel = formData.get('satisfaction_level') as string
  const actualDurationMinutes = formData.get('actual_duration_minutes') as string
  const nextRecommendation = formData.get('next_recommendation') as string
  const symptomIds = formData.getAll('symptoms') as string[]
  const bodyDiagramDataStr = formData.get('body_diagram_data') as string | null

  // バリデーション
  if (!recordId || !treatmentContent || !patientCondition) {
    redirect(`/therapist/appointments?message=Required+fields+missing`)
  }

  if (!improvementLevel || !satisfactionLevel || !actualDurationMinutes) {
    redirect(`/therapist/appointments?message=Required+fields+missing`)
  }

  if (symptomIds.length === 0) {
    redirect(`/therapist/appointments?message=At+least+one+symptom+required`)
  }

  // 改善度・満足度のバリデーション
  const improvement = parseInt(improvementLevel)
  const satisfaction = parseInt(satisfactionLevel)
  if (improvement < 1 || improvement > 5 || satisfaction < 1 || satisfaction > 5) {
    redirect(`/therapist/appointments?message=Invalid+improvement+or+satisfaction+level`)
  }

  // 施術時間のバリデーション
  const duration = parseInt(actualDurationMinutes)
  if (duration < 1 || duration > 300) {
    redirect(`/therapist/appointments?message=Invalid+treatment+duration`)
  }

  // 人体図データのパース（任意）
  let bodyDiagramData = null
  console.log('📊 [UPDATE] Body diagram data string received:', bodyDiagramDataStr ? `${bodyDiagramDataStr.substring(0, 100)}...` : 'null')
  if (bodyDiagramDataStr) {
    try {
      bodyDiagramData = JSON.parse(bodyDiagramDataStr)
      console.log('✅ [UPDATE] Body diagram data parsed successfully:', bodyDiagramData ? 'Has data' : 'null')
      console.log('   Views:', bodyDiagramData?.views ? Object.keys(bodyDiagramData.views) : 'none')
    } catch (error) {
      console.error('❌ [UPDATE] Failed to parse body diagram data:', error)
    }
  } else {
    console.log('⚠️  [UPDATE] No body diagram data received in form')
  }

  // レコードの存在確認と権限チェック
  const { data: existingRecord, error: recordFetchError } = await supabase
    .from('treatment_records')
    .select('id, therapist_id, appointment_id')
    .eq('id', recordId)
    .single()

  if (recordFetchError || !existingRecord) {
    redirect('/therapist/appointments?message=Record+not+found')
  }

  // 整体師本人または管理者のみ編集可能
  const { data: therapistProfile } = await supabase
    .from('therapists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (
    userProfile.role !== 'admin' &&
    existingRecord.therapist_id !== therapistProfile?.id
  ) {
    redirect('/therapist/appointments?message=Permission+denied')
  }

  try {
    // 1. treatment_recordsを更新
    console.log('💾 [UPDATE] Updating record with body_diagram_data:', bodyDiagramData ? 'Present' : 'null')
    const { error: updateError } = await supabase
      .from('treatment_records')
      .update({
        treatment_content: treatmentContent.trim(),
        patient_condition: patientCondition.trim(),
        improvement_level: improvement,
        satisfaction_level: satisfaction,
        actual_duration_minutes: duration,
        next_recommendation: nextRecommendation ? nextRecommendation.trim() : null,
        body_diagram_data: bodyDiagramData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)

    if (updateError) {
      console.error('❌ [UPDATE] Treatment record update error:', updateError)
      redirect(`/therapist/appointments?message=Update+failed`)
    } else {
      console.log('✅ [UPDATE] Record updated successfully')
    }

    // 2. 既存のtreatment_symptomsを削除
    await supabase
      .from('treatment_symptoms')
      .delete()
      .eq('treatment_record_id', recordId)

    // 3. 新しいtreatment_symptomsを挿入
    if (symptomIds.length > 0) {
      const { error: symptomsError } = await supabase
        .from('treatment_symptoms')
        .insert(
          symptomIds.map((symptomId) => ({
            treatment_record_id: recordId,
            symptom_id: symptomId,
          }))
        )

      if (symptomsError) {
        console.error('Treatment symptoms update error:', symptomsError)
      }
    }

    revalidatePath('/therapist/appointments')
    revalidatePath(`/therapist/appointments/${existingRecord.appointment_id}/view`)
    redirect(`/therapist/appointments/${existingRecord.appointment_id}/view?message=success:+Treatment+report+updated`)
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    console.error('Unexpected error:', error)
    redirect(`/therapist/appointments?message=Unexpected+error+occurred`)
  }
}

export async function createTreatmentRecord(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師権限チェック
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const appointmentId = formData.get('appointment_id') as string
  const therapistId = formData.get('therapist_id') as string
  const treatmentContent = formData.get('treatment_content') as string
  const patientCondition = formData.get('patient_condition') as string
  const improvementLevel = formData.get('improvement_level') as string
  const satisfactionLevel = formData.get('satisfaction_level') as string
  const actualDurationMinutes = formData.get('actual_duration_minutes') as string
  const nextRecommendation = formData.get('next_recommendation') as string
  const symptomIds = formData.getAll('symptoms') as string[]
  const bodyDiagramDataStr = formData.get('body_diagram_data') as string | null

  // バリデーション
  if (!appointmentId || !therapistId || !treatmentContent || !patientCondition) {
    redirect(`/therapist/appointments/${appointmentId}/report?message=Required+fields+missing`)
  }

  if (!improvementLevel || !satisfactionLevel || !actualDurationMinutes) {
    redirect(`/therapist/appointments/${appointmentId}/report?message=Required+fields+missing`)
  }

  if (symptomIds.length === 0) {
    redirect(`/therapist/appointments/${appointmentId}/report?message=At+least+one+symptom+required`)
  }

  // 改善度・満足度のバリデーション
  const improvement = parseInt(improvementLevel)
  const satisfaction = parseInt(satisfactionLevel)
  if (improvement < 1 || improvement > 5 || satisfaction < 1 || satisfaction > 5) {
    redirect(`/therapist/appointments/${appointmentId}/report?message=Invalid+improvement+or+satisfaction+level`)
  }

  // 施術時間のバリデーション
  const duration = parseInt(actualDurationMinutes)
  if (duration < 1 || duration > 300) {
    redirect(`/therapist/appointments/${appointmentId}/report?message=Invalid+treatment+duration`)
  }

  // 人体図データのパース（任意）
  let bodyDiagramData = null
  console.log('📊 [CREATE] Body diagram data string received:', bodyDiagramDataStr ? `${bodyDiagramDataStr.substring(0, 100)}...` : 'null')
  if (bodyDiagramDataStr) {
    try {
      bodyDiagramData = JSON.parse(bodyDiagramDataStr)
      console.log('✅ [CREATE] Body diagram data parsed successfully:', bodyDiagramData ? 'Has data' : 'null')
      console.log('   Views:', bodyDiagramData?.views ? Object.keys(bodyDiagramData.views) : 'none')
    } catch (error) {
      console.error('❌ [CREATE] Failed to parse body diagram data:', error)
      // パースに失敗してもエラーにはしない(人体図は任意)
    }
  } else {
    console.log('⚠️  [CREATE] No body diagram data received in form')
  }

  // 予約の存在確認とステータスチェック
  const { data: appointment, error: appointmentFetchError } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single()

  if (appointmentFetchError || !appointment) {
    redirect('/therapist/appointments?message=Appointment+not+found')
  }

  if (appointment.status !== 'approved') {
    redirect('/therapist/appointments?message=Appointment+not+ready+for+report')
  }

  // すでにレポートが記入されているかチェック
  const { data: existingRecord } = await supabase
    .from('treatment_records')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()

  if (existingRecord) {
    redirect('/therapist/appointments?message=Report+already+submitted')
  }

  try {
    // 1. treatment_recordsに挿入
    console.log('💾 [CREATE] Inserting record with body_diagram_data:', bodyDiagramData ? 'Present' : 'null')
    const { data: record, error: recordError } = await supabase
      .from('treatment_records')
      .insert({
        appointment_id: appointmentId,
        therapist_id: therapistId,
        treatment_content: treatmentContent.trim(),
        patient_condition: patientCondition.trim(),
        improvement_level: improvement,
        satisfaction_level: satisfaction,
        actual_duration_minutes: duration,
        next_recommendation: nextRecommendation ? nextRecommendation.trim() : null,
        body_diagram_data: bodyDiagramData,
      })
      .select()
      .single()

    if (recordError || !record) {
      console.error('❌ [CREATE] Treatment record creation error:', recordError)
      redirect(`/therapist/appointments/${appointmentId}/report?message=Treatment+record+creation+failed`)
    } else {
      console.log('✅ [CREATE] Record created successfully, ID:', record.id)
    }

    // 2. treatment_symptomsに挿入
    if (symptomIds.length > 0) {
      const { error: symptomsError } = await supabase
        .from('treatment_symptoms')
        .insert(
          symptomIds.map((symptomId) => ({
            treatment_record_id: record.id,
            symptom_id: symptomId,
          }))
        )

      if (symptomsError) {
        console.error('Treatment symptoms creation error:', symptomsError)
        // 症状の挿入に失敗してもレコードは作成済みなので、警告のみ
      }
    }

    // 3. appointmentsのステータスをcompletedに更新
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Appointment status update error:', updateError)
      // ステータス更新に失敗してもレコードは作成済みなので、警告のみ
    }

    // 法人担当者に完了通知を送信
    try {
      const { data: appointmentInfo } = await supabase
        .from('appointments')
        .select(`
          employee_name,
          employee_id,
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

        if (requestedByUser?.email) {
          await sendTreatmentCompletedEmail(
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
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
    }

    revalidatePath('/therapist/appointments')
    revalidatePath('/company/appointments')
    revalidatePath('/admin/appointments')
    redirect('/therapist/appointments?message=' + encodeURIComponent('success: 施術レポートを記録しました'))
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect(`/therapist/appointments/${appointmentId}/report?message=Unexpected+error+occurred`)
  }
}
