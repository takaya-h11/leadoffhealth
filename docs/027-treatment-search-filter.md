# 027: 施術履歴検索・フィルター機能

## 概要
施術履歴を日付範囲・整体師・法人・症状・社員名/IDで検索・フィルタリングできる機能を実装する。

## 前提条件
- ✅ 施術履歴表示機能が実装されている（026完了）

## タスク

### 1. 検索フォーム作成
```typescript
<form method="get">
  {/* 検索キーワード */}
  <input name="search" placeholder="社員名・社員ID" />

  {/* 日付範囲 */}
  <input type="date" name="from" />
  <input type="date" name="to" />

  {/* 整体師 */}
  <select name="therapist">
    <option value="">すべて</option>
    {therapists?.map(t => (
      <option value={t.id}>{t.users.full_name}</option>
    ))}
  </select>

  {/* 法人 */}
  <select name="company">
    <option value="">すべて</option>
    {companies?.map(c => (
      <option value={c.id}>{c.name}</option>
    ))}
  </select>

  {/* 症状 */}
  <select name="symptom">
    <option value="">すべて</option>
    {symptoms?.map(s => (
      <option value={s.id}>{s.name}</option>
    ))}
  </select>

  <button type="submit">検索</button>
</form>
```

### 2. クエリビルダー実装
```typescript
let query = supabase
  .from('treatment_records')
  .select('*')

if (params.search) {
  query = query.or(`appointments.employee_name.ilike.%${params.search}%,appointments.employee_id.ilike.%${params.search}%`)
}

if (params.from) {
  query = query.gte('appointments.available_slots.start_time', params.from)
}

if (params.therapist) {
  query = query.eq('therapist_id', params.therapist)
}

if (params.symptom) {
  query = query.contains('treatment_symptoms.symptom_id', params.symptom)
}
```

## 完了条件
- [ ] 日付範囲でフィルタリングできる
- [ ] 整体師・法人・症状でフィルタリングできる
- [ ] 社員名・社員IDで検索できる
- [ ] 検索結果の件数が表示される

## 依存チケット
- 026: 施術履歴表示機能

## 次のステップ
- 028: メール通知機能
