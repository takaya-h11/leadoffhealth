# 022: 予約一覧・検索機能

## 概要
管理者・整体師・法人担当者が予約一覧を閲覧し、検索・フィルタリングできる機能を実装する。各ロールに応じたアクセス制御を行う。

## 前提条件
- ✅ 認証機能が実装されている（001-010完了）
- ✅ ユーザー管理機能が実装されている（011-014完了）
- ✅ マスターデータ管理機能が実装されている（015-016完了）
- ✅ 予約管理機能が実装されている（017-021完了）
- ✅ `appointments`, `available_slots`テーブルが作成されている

## タスク

### 1. 予約一覧ページ作成（管理者）
- [ ] `src/app/(protected)/admin/appointments/page.tsx`を作成
- [ ] 全予約を表示
- [ ] 検索・フィルタリング機能を実装

**実装内容:**
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{
    status?: string
    therapist?: string
    company?: string
    from?: string
    to?: string
    search?: string
  }>
}

export default async function AdminAppointmentsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

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

  // クエリビルダー
  let query = supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        start_time,
        end_time,
        therapists (
          id,
          users (
            full_name
          )
        ),
        service_menus (
          name
        )
      ),
      companies (
        id,
        name
      )
    `)

  // ステータスでフィルター
  if (params.status) {
    query = query.eq('status', params.status)
  }

  // 整体師でフィルター
  if (params.therapist) {
    query = query.eq('available_slots.therapists.id', params.therapist)
  }

  // 法人でフィルター
  if (params.company) {
    query = query.eq('company_id', params.company)
  }

  // 日付範囲でフィルター
  if (params.from) {
    query = query.gte('available_slots.start_time', params.from)
  }
  if (params.to) {
    query = query.lte('available_slots.start_time', params.to)
  }

  // 検索（社員名・社員ID）
  if (params.search) {
    query = query.or(`employee_name.ilike.%${params.search}%,employee_id.ilike.%${params.search}%`)
  }

  const { data: appointments } = await query.order('available_slots.start_time', { ascending: false })

  // 整体師一覧を取得（フィルター用）
  const { data: therapists } = await supabase
    .from('therapists')
    .select('id, users(full_name)')
    .eq('is_available', true)

  // 法人一覧を取得（フィルター用）
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">予約管理</h1>

        {/* 検索・フィルターフォーム */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <form method="get" className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                検索
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={params.search}
                placeholder="社員名・ID"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス
              </label>
              <select
                id="status"
                name="status"
                defaultValue={params.status}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                <option value="pending">承認待ち</option>
                <option value="approved">承認済み</option>
                <option value="rejected">拒否</option>
                <option value="cancelled">キャンセル</option>
                <option value="completed">完了</option>
              </select>
            </div>

            <div>
              <label htmlFor="therapist" className="block text-sm font-medium text-gray-700">
                整体師
              </label>
              <select
                id="therapist"
                name="therapist"
                defaultValue={params.therapist}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                {therapists?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.users.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                法人
              </label>
              <select
                id="company"
                name="company"
                defaultValue={params.company}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">すべて</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                期間
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  id="from"
                  name="from"
                  defaultValue={params.from}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  id="to"
                  name="to"
                  defaultValue={params.to}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-end md:col-span-5">
              <button
                type="submit"
                className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                検索
              </button>
              <Link
                href="/admin/appointments"
                className="ml-4 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                リセット
              </Link>
            </div>
          </form>
        </div>

        {/* 予約一覧テーブル */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  整体師
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  法人・社員
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  症状
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {appointments?.map((appointment) => {
                const slot = appointment.available_slots
                const startTime = new Date(slot.start_time)

                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {startTime.toLocaleDateString('ja-JP')}
                      <br />
                      {startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {slot.therapists.users.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{appointment.companies.name}</div>
                      <div className="text-gray-500">
                        {appointment.employee_name} ({appointment.employee_id})
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {appointment.symptoms?.join(', ') || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-2 text-xs font-semibold ${
                          appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : appointment.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'cancelled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {appointment.status === 'pending'
                          ? '承認待ち'
                          : appointment.status === 'approved'
                          ? '承認済み'
                          : appointment.status === 'rejected'
                          ? '拒否'
                          : appointment.status === 'cancelled'
                          ? 'キャンセル'
                          : '完了'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/appointments/${appointment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {appointments?.length === 0 && (
          <div className="mt-4 text-center text-gray-500">
            該当する予約が見つかりませんでした
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          {appointments?.length || 0}件の予約が見つかりました
        </div>
      </div>
    </div>
  )
}
```

### 2. 予約一覧ページ作成（法人担当者）
- [ ] `src/app/(protected)/company/appointments/page.tsx`を作成
- [ ] 自社の予約のみ表示

### 3. 予約詳細ページ作成
- [ ] `src/app/(protected)/admin/appointments/[id]/page.tsx`を作成
- [ ] 予約の詳細情報を表示
- [ ] ステータス履歴を表示

## 完了条件
- [ ] 予約一覧が表示される
- [ ] ステータス・整体師・法人・日付範囲でフィルタリングできる
- [ ] 社員名・社員IDで検索できる
- [ ] 管理者は全予約を閲覧できる
- [ ] 法人担当者は自社の予約のみ閲覧できる
- [ ] 検索結果の件数が表示される

## 注意事項
- 検索は大文字小文字を区別しない
- 日付範囲は開始日時でフィルタリング
- ページングは100件以上の場合に実装

## 依存チケット
- 001-010: 基本認証機能
- 011-021: ユーザー・予約管理機能

## 次のステップ
- 023: 予約キャンセル機能
