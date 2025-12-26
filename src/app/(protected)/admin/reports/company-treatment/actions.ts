'use server'

import { createClient } from '@/utils/supabase/server'
import type {
  CompanyTreatmentReportData,
  TreatmentDetail,
  SymptomDistribution,
  ImprovementDistribution,
  SatisfactionDistribution,
  MonthlyTrend,
  TreatmentsByUser,
} from '@/types/report'

export async function fetchCompanyTreatmentData(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<CompanyTreatmentReportData> {
  const supabase = await createClient()

  // 管理者権限チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')

  const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (userProfile?.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }

  // 法人情報取得
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single()

  if (!company) {
    throw new Error('法人が見つかりません')
  }

  // 施術データ取得
  const endDateTime = new Date(endDate)
  endDateTime.setHours(23, 59, 59, 999)

  const { data: treatments, error } = await supabase
    .from('treatment_records')
    .select(
      `
      *,
      appointments!inner (
        employee_name,
        employee_id,
        user_id,
        users!appointments_user_id_fkey (
          full_name,
          id
        ),
        companies!inner (
          id,
          name
        ),
        available_slots!inner (
          start_time,
          therapist_id,
          therapists (
            id,
            users (
              full_name
            )
          )
        )
      ),
      treatment_symptoms (
        symptom_id,
        symptoms (
          name
        )
      )
    `
    )
    .eq('appointments.company_id', companyId)
    .gte('appointments.available_slots.start_time', startDate)
    .lte('appointments.available_slots.start_time', endDateTime.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  if (!treatments || treatments.length === 0) {
    throw new Error('指定期間に施術データがありません')
  }

  // データ処理
  const treatmentDetails: TreatmentDetail[] = []
  const symptomCounts: Record<string, number> = {}
  const improvementCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const satisfactionCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  const monthlyData: Record<string, { count: number; improvementSum: number; satisfactionSum: number }> = {}
  let totalDuration = 0
  let totalImprovement = 0
  let totalSatisfaction = 0
  const uniqueUserIds = new Set<string>()
  const uniqueEmployeeIds = new Set<string>()

  for (const treatment of treatments) {
    const appointment = Array.isArray(treatment.appointments)
      ? treatment.appointments[0]
      : treatment.appointments
    const slot = Array.isArray(appointment?.available_slots)
      ? appointment.available_slots[0]
      : appointment?.available_slots
    const therapist = Array.isArray(slot?.therapists) ? slot.therapists[0] : slot?.therapists
    const therapistUser = Array.isArray(therapist?.users) ? therapist.users[0] : therapist?.users
    const startTime = slot?.start_time ? new Date(slot.start_time) : new Date()

    // 症状収集
    const treatmentSymptoms = Array.isArray(treatment.treatment_symptoms)
      ? treatment.treatment_symptoms
      : []
    const symptomNames = treatmentSymptoms
      .map((ts: { symptoms: { name: string } | { name: string }[] }) => {
        const symptom = Array.isArray(ts.symptoms) ? ts.symptoms[0] : ts.symptoms
        return symptom?.name
      })
      .filter(Boolean) as string[]

    // 症状分布カウント
    symptomNames.forEach((symptom) => {
      symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
    })

    // 改善度・満足度カウント
    if (treatment.improvement_level) {
      improvementCounts[treatment.improvement_level] =
        (improvementCounts[treatment.improvement_level] || 0) + 1
      totalImprovement += treatment.improvement_level
    }
    if (treatment.satisfaction_level) {
      satisfactionCounts[treatment.satisfaction_level] =
        (satisfactionCounts[treatment.satisfaction_level] || 0) + 1
      totalSatisfaction += treatment.satisfaction_level
    }

    // 月次データ
    const monthKey = startTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, improvementSum: 0, satisfactionSum: 0 }
    }
    monthlyData[monthKey].count += 1
    monthlyData[monthKey].improvementSum += treatment.improvement_level || 0
    monthlyData[monthKey].satisfactionSum += treatment.satisfaction_level || 0

    // 施術時間集計
    if (treatment.actual_duration_minutes) {
      totalDuration += treatment.actual_duration_minutes
    }

    // ユニーク利用者カウント
    // 新フロー: user_id、旧フロー: employee_id を使用
    if (appointment?.user_id) {
      uniqueUserIds.add(appointment.user_id)
    } else if (appointment?.employee_id) {
      // 旧フローの場合はemployee_idをuser_idの代わりに使用
      uniqueUserIds.add(appointment.employee_id)
    }

    // 旧フローとの互換性のためemployee_idも収集
    if (appointment?.employee_id) {
      uniqueEmployeeIds.add(appointment.employee_id)
    }

    // 社員情報取得（usersテーブル優先、なければemployee_name）
    const appointmentUser = Array.isArray(appointment?.users)
      ? appointment.users[0]
      : appointment?.users
    const employeeName = appointmentUser?.full_name || appointment?.employee_name || '不明'

    // 詳細データ作成
    treatmentDetails.push({
      id: treatment.id,
      date: startTime,
      therapistName: therapistUser?.full_name || '不明',
      symptoms: symptomNames,
      improvementLevel: treatment.improvement_level || 0,
      satisfactionLevel: treatment.satisfaction_level || 0,
      treatmentContent: treatment.treatment_content || '',
      patientCondition: treatment.patient_condition || '',
      actualDurationMinutes: treatment.actual_duration_minutes || null,
      nextRecommendation: treatment.next_recommendation || null,
      bodyDiagramImageUrl: treatment.body_diagram_image_url || null,
      employeeName: employeeName,
      employeeId: appointment?.employee_id || '',
    })
  }

  // 症状分布
  const symptomDistribution: SymptomDistribution[] = Object.entries(symptomCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  // 改善度分布
  const improvementDistribution: ImprovementDistribution[] = Object.entries(improvementCounts)
    .map(([level, value]) => ({
      label: `レベル${level}`,
      value,
    }))

  // 満足度分布
  const satisfactionDistribution: SatisfactionDistribution[] = Object.entries(satisfactionCounts)
    .map(([level, value]) => ({
      label: `レベル${level}`,
      value,
    }))

  // 月次推移
  const monthlyTrends: MonthlyTrend[] = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      appointments: data.count,
      avgImprovement: data.count > 0 ? data.improvementSum / data.count : 0,
      avgSatisfaction: data.count > 0 ? data.satisfactionSum / data.count : 0,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateA.getTime() - dateB.getTime()
    })

  // 利用者別グループ化
  const userTreatmentsMap: Record<string, TreatmentsByUser> = {}
  for (const detail of treatmentDetails) {
    const key = detail.employeeId
    if (!userTreatmentsMap[key]) {
      userTreatmentsMap[key] = {
        employeeName: detail.employeeName,
        employeeId: detail.employeeId,
        treatments: [],
      }
    }
    userTreatmentsMap[key].treatments.push(detail)
  }

  // 各利用者の施術を日付順にソート
  const treatmentsByUser: TreatmentsByUser[] = Object.values(userTreatmentsMap).map((user) => ({
    ...user,
    treatments: user.treatments.sort((a, b) => a.date.getTime() - b.date.getTime()),
  }))

  // 平均計算
  const averageImprovement = treatments.length > 0 ? totalImprovement / treatments.length : 0
  const averageSatisfaction = treatments.length > 0 ? totalSatisfaction / treatments.length : 0

  return {
    companyName: company.name,
    startDate,
    endDate,
    totalAppointments: treatments.length,
    totalEmployees: treatments.length,
    uniqueEmployees: uniqueUserIds.size,
    totalDurationMinutes: totalDuration,
    averageImprovement,
    averageSatisfaction,
    symptomDistribution,
    improvementDistribution,
    satisfactionDistribution,
    monthlyTrends,
    treatmentsByUser,
  }
}
