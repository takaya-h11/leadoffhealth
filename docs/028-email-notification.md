# 028: メール通知機能（Resend）

## 概要
Resendを使用してメール通知を送信する機能を実装する。予約申込・承認・拒否時に通知を送信する。

## 前提条件
- ✅ 予約管理機能が実装されている（017-024完了）

## タスク

### 1. Resendのインストールと設定
```bash
npm install resend
```

環境変数:
```
RESEND_API_KEY=your_api_key
```

### 2. メール送信ユーティリティ作成
```typescript
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendAppointmentRequestEmail(
  therapistEmail: string,
  therapistName: string,
  appointment: any
) {
  await resend.emails.send({
    from: 'LeadOffHealth <noreply@leadoffhealth.com>',
    to: therapistEmail,
    subject: `【新規予約申込】${new Date(appointment.start_time).toLocaleDateString('ja-JP')}`,
    html: `
      <h2>${therapistName}様</h2>
      <p>新しい予約申込が届きました。</p>
      <h3>予約詳細</h3>
      <ul>
        <li>日時: ${new Date(appointment.start_time).toLocaleString('ja-JP')}</li>
        <li>法人: ${appointment.company_name}</li>
        <li>社員名: ${appointment.employee_name}</li>
        <li>症状: ${appointment.symptoms.join(', ')}</li>
      </ul>
      <p>管理画面から承認・拒否をお願いします。</p>
      <a href="https://your-app-url.com/therapist/appointments">管理画面を開く</a>
    `,
  })
}

export async function sendAppointmentApprovedEmail(
  companyUserEmail: string,
  appointment: any
) {
  await resend.emails.send({
    from: 'LeadOffHealth <noreply@leadoffhealth.com>',
    to: companyUserEmail,
    subject: `【予約確定】${new Date(appointment.start_time).toLocaleDateString('ja-JP')}`,
    html: `
      <h2>予約が確定しました</h2>
      <p>予約が確定しました。当日はよろしくお願いいたします。</p>
      <h3>予約詳細</h3>
      <ul>
        <li>日時: ${new Date(appointment.start_time).toLocaleString('ja-JP')}</li>
        <li>担当整体師: ${appointment.therapist_name}</li>
        <li>社員名: ${appointment.employee_name}</li>
      </ul>
    `,
  })
}

export async function sendAppointmentRejectedEmail(
  companyUserEmail: string,
  appointment: any,
  reason: string
) {
  await resend.emails.send({
    from: 'LeadOffHealth <noreply@leadoffhealth.com>',
    to: companyUserEmail,
    subject: `【予約拒否】${new Date(appointment.start_time).toLocaleDateString('ja-JP')}`,
    html: `
      <h2>予約が拒否されました</h2>
      <p>大変申し訳ございませんが、以下の予約が拒否されました。</p>
      <h3>拒否理由</h3>
      <p>${reason}</p>
      <p>別の日時で再度お申し込みください。</p>
    `,
  })
}
```

### 3. Server Actionsに統合
```typescript
// 予約申込時
await createAppointment(formData)
await sendAppointmentRequestEmail(therapistEmail, therapistName, appointment)

// 承認時
await approveAppointment(appointmentId)
await sendAppointmentApprovedEmail(companyUserEmail, appointment)

// 拒否時
await rejectAppointment(appointmentId, reason)
await sendAppointmentRejectedEmail(companyUserEmail, appointment, reason)
```

## 完了条件
- [ ] 予約申込時に整体師にメール送信
- [ ] 承認時に法人担当者にメール送信
- [ ] 拒否時に法人担当者にメール送信（拒否理由含む）
- [ ] メール送信エラー時のハンドリング

## 依存チケット
- 017-024: 予約管理機能

## 次のステップ
- 029: アプリ内通知機能
