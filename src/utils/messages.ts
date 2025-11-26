/**
 * エラーメッセージの翻訳マップ
 * URLパラメータは英語で、表示は日本語にする
 */
export const messageTranslations: Record<string, string> = {
  // Appointment messages
  'Required fields missing': '必須項目を入力してください',
  'Slot not found': '時間枠が見つかりません',
  'Slot already booked': 'この時間枠は既に予約されています',
  'Booking must be 3 days in advance': '予約は3日前までにお願いします',
  'Appointment creation failed': '予約の作成に失敗しました',
  'Appointment requested successfully': '予約を申し込みました',
  'Appointment not found': '予約が見つかりません',
  'No permission to cancel': 'キャンセル権限がありません',
  'Cannot cancel this appointment': 'この予約はキャンセルできません',
  'Cancellation deadline passed': 'キャンセル期限を過ぎています',
  'Cancellation failed': 'キャンセルに失敗しました',
  'Appointment cancelled successfully': '予約をキャンセルしました',
  'Appointment approval failed': '予約の承認に失敗しました',
  'Appointment approved successfully': '予約を承認しました',
  'Rejected reason is required': '拒否理由を入力してください',
  'Appointment rejection failed': '予約の拒否に失敗しました',
  'Appointment rejected successfully': '予約を拒否しました',
  'Unexpected error occurred': '予期しないエラーが発生しました',

  // Admin appointment messages
  'success_approved': '予約を承認しました（管理者による代理承認）',
  'success_rejected': '予約を拒否しました（管理者による代理操作）',
  'error_approval_failed': '予約の承認に失敗しました',
  'error_rejection_failed': '予約の拒否に失敗しました',
  'error_reason_required': '拒否理由を入力してください',
  'error_unexpected': '予期しないエラーが発生しました',

  // Slot messages
  'Slot deleted successfully': '空き枠を削除しました',
  'Cannot delete other therapist slots': '他の整体師の空き枠は削除できません',
  'Cannot delete booked slot': '予約済みの空き枠は削除できません',
  'Cannot delete past slot': '過去の空き枠は削除できません',
  'Cannot delete slot with appointments': '予約が存在するため削除できません',
  'Slot deletion failed': '空き枠の削除に失敗しました',
  'Therapist info not found': '整体師情報が見つかりません',
  'No permission': '権限がありません',

  // Company messages
  'Company info not found': '法人情報が見つかりません',

  // General messages
  'Demo login failed': 'デモログインに失敗しました',
  'Error fetching profile': 'プロフィールの取得に失敗しました',

  // Therapist management messages
  'success: Existing user registered as therapist': '既存ユーザーを整体師として登録しました',

  // Service menu messages
  'Invalid duration': '施術時間は正の整数で入力してください',
  'Invalid price': '料金は0以上の整数で入力してください',
  'success: Service menu created': '施術メニューを登録しました',
  'success: Service menu updated': '施術メニュー情報を更新しました',
  'success: Service menu deactivated': '施術メニューを無効化しました',

  // Treatment report messages
  'At least one symptom required': '施術した症状を少なくとも1つ選択してください',
  'Invalid improvement or satisfaction level': '改善度・満足度は1〜5の範囲で入力してください',
  'Invalid treatment duration': '実際の施術時間は1〜300分の範囲で入力してください',
  'Appointment not ready for report': 'この予約の施術レポートを記入できる状態ではありません',
  'Report already submitted': 'この予約のレポートは既に記入済みです',
  'Treatment record creation failed': '施術レポートの記録に失敗しました',
  'No permission to fill report': 'この予約の施術レポートを記入する権限がありません',
  'success: Treatment report submitted': '施術レポートを記録しました',
}

/**
 * メッセージを日本語に翻訳
 * @param message 英語のメッセージキー
 * @returns 日本語のメッセージ、存在しない場合は元のメッセージ
 */
export function translateMessage(message: string | undefined | null): string {
  if (!message) return ''

  // URLエンコードされたスペース（+）を通常のスペースに変換
  const decodedMessage = message.replace(/\+/g, ' ')

  // 翻訳マップから日本語を取得、なければ元のメッセージを返す
  return messageTranslations[decodedMessage] || decodedMessage
}
