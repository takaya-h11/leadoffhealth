# 025: 施術後レポート記入機能（整体師）

## 概要
整体師が施術完了後にレポートを記入する機能を実装する。施術内容・顧客状態・症状・改善度・満足度・実際の施術時間・次回の提案を記録する。

## 前提条件
- ✅ 予約管理機能が実装されている（017-024完了）
- ✅ `treatment_records`, `treatment_symptoms`テーブルが作成されている

## タスク

### 1. 施術後レポート記入ページ作成
```typescript
export default async function TreatmentReportPage({ params }: { params: { id: string } }) {
  const appointmentId = params.id

  // approved状態の予約を取得
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, available_slots(*), companies(*)')
    .eq('id', appointmentId)
    .eq('status', 'approved')
    .single()

  // 症状マスター取得
  const { data: symptoms } = await supabase
    .from('symptoms')
    .select('*')
    .eq('is_active', true)

  return (
    <form action={createTreatmentRecord}>
      <input type="hidden" name="appointment_id" value={appointmentId} />

      {/* 施術内容 */}
      <textarea name="treatment_content" required />

      {/* 顧客の状態 */}
      <textarea name="patient_condition" required />

      {/* 症状（複数選択） */}
      {symptoms?.map((s) => (
        <label key={s.id}>
          <input type="checkbox" name="symptoms" value={s.id} />
          {s.name}
        </label>
      ))}

      {/* 改善度（1-5） */}
      <select name="improvement_level">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {/* 満足度（1-5） */}
      <select name="satisfaction_level">
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      {/* 実際の施術時間 */}
      <input type="number" name="actual_duration_minutes" min="1" />

      {/* 次回の提案 */}
      <textarea name="next_recommendation" />

      <button type="submit">記録</button>
    </form>
  )
}
```

### 2. Server Actions作成
```typescript
'use server'

export async function createTreatmentRecord(formData: FormData) {
  const appointmentId = formData.get('appointment_id') as string
  const symptomIds = formData.getAll('symptoms') as string[]

  // treatment_recordsに挿入
  const { data: record } = await supabase
    .from('treatment_records')
    .insert({
      appointment_id: appointmentId,
      therapist_id: therapistId,
      treatment_content: formData.get('treatment_content'),
      patient_condition: formData.get('patient_condition'),
      improvement_level: parseInt(formData.get('improvement_level') as string),
      satisfaction_level: parseInt(formData.get('satisfaction_level') as string),
      actual_duration_minutes: parseInt(formData.get('actual_duration_minutes') as string),
      next_recommendation: formData.get('next_recommendation'),
    })
    .select()
    .single()

  // treatment_symptomsに挿入
  if (symptomIds.length > 0) {
    await supabase
      .from('treatment_symptoms')
      .insert(
        symptomIds.map((id) => ({
          treatment_record_id: record.id,
          symptom_id: id,
        }))
      )
  }

  // appointmentsのステータスをcompletedに更新
  await supabase
    .from('appointments')
    .update({ status: 'completed' })
    .eq('id', appointmentId)

  revalidatePath('/therapist/appointments')
  redirect('/therapist/appointments?message=Treatment record created')
}
```

## 完了条件
- [ ] 施術後レポートを記入できる
- [ ] 症状を複数選択できる
- [ ] 改善度・満足度を1-5で評価できる
- [ ] レポート記入後、予約がcompletedになる

## 依存チケット
- 017-024: 予約管理機能

## 次のステップ
- 026: 施術履歴表示機能
