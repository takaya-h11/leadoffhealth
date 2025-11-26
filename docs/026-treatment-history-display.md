# 026: 施術履歴表示機能

## 概要
管理者・整体師・法人担当者が施術履歴を閲覧できる機能を実装する。各ロールに応じたアクセス制御を行う。

## 前提条件
- ✅ 施術後レポート記入機能が実装されている（025完了）

## タスク

### 1. 施術履歴一覧ページ作成（管理者）
```typescript
export default async function AdminTreatmentHistoryPage() {
  const { data: treatments } = await supabase
    .from('treatment_records')
    .select(`
      *,
      appointments (
        employee_name,
        employee_id,
        companies (name),
        available_slots (
          start_time,
          therapists (
            users (full_name)
          )
        )
      ),
      treatment_symptoms (
        symptoms (name)
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1>施術履歴</h1>
      {treatments?.map((t) => (
        <div key={t.id}>
          <h3>{t.appointments.companies.name} - {t.appointments.employee_name}</h3>
          <p>整体師: {t.appointments.available_slots.therapists.users.full_name}</p>
          <p>日時: {new Date(t.appointments.available_slots.start_time).toLocaleDateString('ja-JP')}</p>
          <p>症状: {t.treatment_symptoms.map(ts => ts.symptoms.name).join(', ')}</p>
          <p>改善度: {t.improvement_level}/5</p>
          <p>満足度: {t.satisfaction_level}/5</p>
          <Link href={`/admin/treatments/${t.id}`}>詳細</Link>
        </div>
      ))}
    </div>
  )
}
```

### 2. 施術履歴詳細ページ作成
```typescript
export default async function TreatmentDetailPage({ params }: { params: { id: string } }) {
  const { data: treatment } = await supabase
    .from('treatment_records')
    .select(`
      *,
      appointments (*,
        companies (*),
        available_slots (*, therapists (*, users (*)))
      ),
      treatment_symptoms (symptoms (*))
    `)
    .eq('id', params.id)
    .single()

  return (
    <div>
      <h1>施術履歴詳細</h1>
      <dl>
        <dt>施術内容</dt>
        <dd>{treatment.treatment_content}</dd>
        <dt>顧客の状態</dt>
        <dd>{treatment.patient_condition}</dd>
        <dt>次回の提案</dt>
        <dd>{treatment.next_recommendation}</dd>
      </dl>
    </div>
  )
}
```

### 3. 法人担当者用施術履歴（自社のみ）
```typescript
export default async function CompanyTreatmentHistoryPage() {
  // 自社の施術履歴のみ取得
  const { data: treatments } = await supabase
    .from('treatment_records')
    .select('*, appointments!inner(*)')
    .eq('appointments.company_id', userProfile.company_id)
    .order('created_at', { ascending: false })

  // ...
}
```

## 完了条件
- [ ] 管理者は全施術履歴を閲覧できる
- [ ] 整体師は全施術履歴を閲覧できる
- [ ] 法人担当者は自社の施術履歴のみ閲覧できる
- [ ] 施術詳細を確認できる

## 依存チケット
- 025: 施術後レポート記入機能

## 次のステップ
- 027: 施術履歴検索・フィルター機能
