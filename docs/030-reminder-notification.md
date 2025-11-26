# 030: リマインド通知機能

## 概要
予約の前日20時にリマインド通知をメールとアプリ内通知で送信する機能を実装する。Vercel Cron Jobsを使用する。

## 前提条件
- ✅ 予約管理機能が実装されている（017-024完了）
- ✅ メール通知機能が実装されている（028完了）
- ✅ アプリ内通知機能が実装されている（029完了）

## タスク

### 1. Cron Job用APIルート作成
```typescript
// src/app/api/cron/send-reminders/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendReminderEmail } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

export async function GET(request: Request) {
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

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      available_slots (
        start_time,
        end_time,
        therapists (
          users (id, full_name, email)
        ),
        service_menus (name)
      ),
      companies (name),
      users!requested_by (id, email)
    `)
    .eq('status', 'approved')
    .gte('available_slots.start_time', tomorrow.toISOString())
    .lt('available_slots.start_time', dayAfterTomorrow.toISOString())

  // リマインド送信
  for (const appointment of appointments || []) {
    const therapist = appointment.available_slots.therapists.users
    const companyUser = appointment.users

    // 整体師にメール送信
    await sendReminderEmail(
      therapist.email,
      therapist.full_name,
      '整体師',
      appointment
    )

    // 整体師にアプリ内通知
    await createNotification(
      therapist.id,
      'reminder',
      '明日の予約のリマインド',
      `明日 ${new Date(appointment.available_slots.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} から ${appointment.companies.name} - ${appointment.employee_name}様の施術があります`,
      appointment.id
    )

    // 法人担当者にメール送信
    await sendReminderEmail(
      companyUser.email,
      appointment.employee_name,
      '法人担当者',
      appointment
    )

    // 法人担当者にアプリ内通知
    await createNotification(
      companyUser.id,
      'reminder',
      '明日の予約のリマインド',
      `明日 ${new Date(appointment.available_slots.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} に ${appointment.employee_name}様の施術予約があります`,
      appointment.id
    )
  }

  return NextResponse.json({
    success: true,
    remindersSent: appointments?.length || 0,
  })
}
```

### 2. メールテンプレート追加
```typescript
// src/lib/email.ts
export async function sendReminderEmail(
  email: string,
  name: string,
  role: string,
  appointment: any
) {
  const startTime = new Date(appointment.available_slots.start_time)

  await resend.emails.send({
    from: 'LeadOffHealth <noreply@leadoffhealth.com>',
    to: email,
    subject: `【リマインド】明日の施術予約 ${startTime.toLocaleDateString('ja-JP')}`,
    html: `
      <h2>${name}様</h2>
      <p>明日の施術予約のリマインドです。</p>
      <h3>予約詳細</h3>
      <ul>
        <li>日時: ${startTime.toLocaleString('ja-JP')}</li>
        ${role === '整体師' ? `
          <li>法人: ${appointment.companies.name}</li>
          <li>社員名: ${appointment.employee_name}</li>
        ` : `
          <li>担当整体師: ${appointment.available_slots.therapists.users.full_name}</li>
          <li>社員名: ${appointment.employee_name}</li>
        `}
        <li>メニュー: ${appointment.available_slots.service_menus.name}</li>
      </ul>
      <p>よろしくお願いいたします。</p>
    `,
  })
}
```

### 3. vercel.jsonの設定
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 20 * * *"
    }
  ]
}
```

### 4. 環境変数の設定
```
CRON_SECRET=your_random_secret_key
```

## 完了条件
- [ ] 毎日20時にCron Jobが実行される
- [ ] 明日のapproved予約に対してリマインド送信
- [ ] 整体師と法人担当者の両方に送信
- [ ] メールとアプリ内通知の両方で送信
- [ ] Cron Jobのセキュリティが担保されている

## 注意事項
- Vercel Cron Jobsは本番環境でのみ動作
- ローカル開発ではAPIルートを直接呼び出してテスト
- タイムゾーンはUTC（日本時間 - 9時間）
- リマインドは1回のみ（重複送信しない）

## 依存チケット
- 017-024: 予約管理機能
- 028: メール通知機能
- 029: アプリ内通知機能

## 次のステップ
- Phase 9以降: レポート・請求機能、ダッシュボード、自動処理
