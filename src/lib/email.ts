import { Resend } from 'resend'

// 開発環境ではResend APIキーがない場合があるため、条件付きで初期化
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// メール送信が有効かチェック
const isEmailEnabled = !!resend

interface AppointmentEmailData {
  startTime: string
  endTime: string
  companyName: string
  employeeName: string
  employeeId: string
  symptoms: string[]
  notes?: string
  therapistName?: string
  rejectedReason?: string
}

/**
 * 予約申込通知を整体師に送信
 */
export async function sendAppointmentRequestEmail(
  therapistEmail: string,
  therapistName: string,
  appointment: AppointmentEmailData
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Appointment request email would be sent to:', therapistEmail)
    return
  }

  try {
    const startTime = new Date(appointment.startTime)
    const endTime = new Date(appointment.endTime)

    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: therapistEmail,
      subject: `【新規予約申込】${startTime.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
            .label { font-weight: 600; color: #4b5563; }
            .value { color: #1f2937; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .button:hover { background-color: #2563eb; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${therapistName}様</h2>
            <p>新しい予約申込が届きました。</p>

            <div class="section">
              <h3>予約詳細</h3>
              <ul>
                <li><span class="label">日時:</span> ${startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })} ${startTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })} 〜 ${endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</li>
                <li><span class="label">法人:</span> ${appointment.companyName}</li>
                <li><span class="label">社員名:</span> ${appointment.employeeName}</li>
                <li><span class="label">社員ID:</span> ${appointment.employeeId}</li>
                <li><span class="label">症状:</span> ${appointment.symptoms.length > 0 ? appointment.symptoms.join(', ') : '-'}</li>
                ${appointment.notes ? `<li><span class="label">要望:</span> ${appointment.notes}</li>` : ''}
              </ul>
            </div>

            <p>管理画面から承認・拒否をお願いします。</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/therapist/appointments" class="button">管理画面を開く</a>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send appointment request email:', error)
    // エラーは記録するが、処理は継続
  }
}

/**
 * 予約承認通知を法人担当者に送信
 */
export async function sendAppointmentApprovedEmail(
  companyUserEmail: string,
  companyUserName: string,
  appointment: AppointmentEmailData
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Appointment approved email would be sent to:', companyUserEmail)
    return
  }

  try {
    const startTime = new Date(appointment.startTime)
    const endTime = new Date(appointment.endTime)

    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: companyUserEmail,
      subject: `【予約確定】${startTime.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981; }
            .label { font-weight: 600; color: #4b5563; }
            .value { color: #1f2937; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${companyUserName}様</h2>
            <p>予約が確定しました。当日はよろしくお願いいたします。</p>

            <div class="section">
              <h3>予約詳細</h3>
              <ul>
                <li><span class="label">日時:</span> ${startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })} ${startTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })} 〜 ${endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</li>
                <li><span class="label">担当整体師:</span> ${appointment.therapistName || '不明'}</li>
                <li><span class="label">社員名:</span> ${appointment.employeeName}</li>
                <li><span class="label">社員ID:</span> ${appointment.employeeId}</li>
              </ul>
            </div>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send appointment approved email:', error)
  }
}

/**
 * 予約拒否通知を法人担当者に送信
 */
export async function sendAppointmentRejectedEmail(
  companyUserEmail: string,
  companyUserName: string,
  appointment: AppointmentEmailData
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Appointment rejected email would be sent to:', companyUserEmail)
    return
  }

  try {
    const startTime = new Date(appointment.startTime)

    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: companyUserEmail,
      subject: `【予約拒否】${startTime.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #ef4444; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444; }
            .label { font-weight: 600; color: #4b5563; }
            .reason { padding: 15px; background-color: #fff; border-radius: 4px; margin: 10px 0; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${companyUserName}様</h2>
            <p>大変申し訳ございませんが、以下の予約が拒否されました。</p>

            <div class="section">
              <h3>予約詳細</h3>
              <ul>
                <li><span class="label">日時:</span> ${startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })} ${startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</li>
                <li><span class="label">社員名:</span> ${appointment.employeeName}</li>
                <li><span class="label">社員ID:</span> ${appointment.employeeId}</li>
              </ul>

              <h3 style="margin-top: 20px;">拒否理由</h3>
              <div class="reason">
                ${appointment.rejectedReason || '理由が記載されていません'}
              </div>
            </div>

            <p>別の日時で再度お申し込みいただけますようお願いいたします。</p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send appointment rejected email:', error)
  }
}

/**
 * 施術完了通知を法人担当者に送信
 */
export async function sendTreatmentCompletedEmail(
  companyUserEmail: string,
  companyUserName: string,
  appointment: AppointmentEmailData
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Treatment completed email would be sent to:', companyUserEmail)
    return
  }

  try {
    const startTime = new Date(appointment.startTime)

    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: companyUserEmail,
      subject: `【施術完了】${startTime.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 8px; }
            .label { font-weight: 600; color: #4b5563; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${companyUserName}様</h2>
            <p>施術が完了しました。施術レポートを管理画面からご確認いただけます。</p>

            <div class="section">
              <h3>施術情報</h3>
              <ul>
                <li><span class="label">日時:</span> ${startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} ${startTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</li>
                <li><span class="label">担当整体師:</span> ${appointment.therapistName || '不明'}</li>
                <li><span class="label">社員名:</span> ${appointment.employeeName}</li>
              </ul>
            </div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/company/treatments" class="button">施術履歴を見る</a>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send treatment completed email:', error)
  }
}

/**
 * リマインド通知を送信（整体師 or 法人担当者）
 */
export async function sendReminderEmail(
  email: string,
  name: string,
  role: '整体師' | '法人担当者',
  appointment: {
    employee_name: string;
    employee_id?: string;
    available_slots: {
      start_time: string;
      end_time: string;
      service_menus: { name: string };
      therapists?: {
        users: {
          full_name: string;
        };
      };
    };
    companies: { name: string };
  }
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Reminder email would be sent to:', email)
    return
  }

  try {
    const startTime = new Date(appointment.available_slots.start_time)
    const endTime = new Date(appointment.available_slots.end_time)

    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: email,
      subject: `【リマインド】明日の施術予約 ${startTime.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .label { font-weight: 600; color: #4b5563; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
            .reminder-badge { display: inline-block; padding: 4px 12px; background-color: #f59e0b; color: white; border-radius: 4px; font-size: 14px; font-weight: 600; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="reminder-badge">リマインド</span>
            <h2>${name}様</h2>
            <p>明日の施術予約のリマインドです。</p>

            <div class="section">
              <h3>予約詳細</h3>
              <ul>
                <li><span class="label">日時:</span> ${startTime.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })} ${startTime.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      })} 〜 ${endTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</li>
                ${
                  role === '整体師'
                    ? `
                  <li><span class="label">法人:</span> ${appointment.companies?.name || '不明'}</li>
                  <li><span class="label">社員名:</span> ${appointment.employee_name}</li>
                  <li><span class="label">社員ID:</span> ${appointment.employee_id}</li>
                `
                    : `
                  <li><span class="label">社員名:</span> ${appointment.employee_name}</li>
                  <li><span class="label">担当整体師:</span> ${
                      appointment.available_slots?.therapists?.users?.full_name || '不明'
                    }</li>
                `
                }
                <li><span class="label">メニュー:</span> ${
                  appointment.available_slots?.service_menus?.name || '不明'
                }</li>
              </ul>
            </div>

            <p>よろしくお願いいたします。</p>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send reminder email:', error)
  }
}

/**
 * 初期パスワード再発行通知を法人担当者に送信
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  newPassword: string,
  companyName: string
) {
  if (!isEmailEnabled) {
    console.log('[EMAIL MOCK] Password reset email would be sent to:', email)
    console.log('[EMAIL MOCK] New password:', newPassword)
    return
  }

  try {
    await resend!.emails.send({
      from: 'LeadOffHealth <noreply@leadoffhealth.com>',
      to: email,
      subject: '【LeadOffHealth】初期パスワード再発行のお知らせ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            .section { margin: 20px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6; }
            .label { font-weight: 600; color: #4b5563; }
            .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #1f2937; background-color: #fff; padding: 12px; border-radius: 4px; margin: 10px 0; display: inline-block; letter-spacing: 1px; }
            .warning { padding: 12px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin: 15px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${name}様</h2>
            <p>${companyName} ご担当者様</p>
            <p>LeadOffHealth予約管理システムの初期パスワードを再発行いたしました。</p>

            <div class="section">
              <h3>ログイン情報</h3>
              <p><span class="label">メールアドレス:</span> ${email}</p>
              <p><span class="label">初期パスワード:</span></p>
              <div class="password">${newPassword}</div>
            </div>

            <div class="warning">
              <strong>⚠️ 重要</strong>
              <ul>
                <li>このパスワードは厳重に管理してください</li>
                <li>初回ログイン時に必ず新しいパスワードへの変更が必要です</li>
                <li>このメールは削除せず、パスワード変更後に破棄してください</li>
              </ul>
            </div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">ログイン画面へ</a>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              このメールはLeadOffHealth予約管理システムから自動送信されています。<br>
              ご不明な点がございましたら、管理者までお問い合わせください。
            </p>
          </div>
        </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error // 管理者に通知するためエラーを再スロー
  }
}
