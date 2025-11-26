/**
 * 予約ステータスの型定義
 */
export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed'

/**
 * 有効なステータス遷移マップ
 */
const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['completed', 'cancelled'],
  rejected: [],
  cancelled: [],
  completed: [],
}

/**
 * 現在のステータスから新しいステータスへの遷移が可能かチェック
 * @param currentStatus 現在のステータス
 * @param newStatus 新しいステータス
 * @returns 遷移可能な場合true、不可能な場合false
 */
export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  if (!isValidStatus(currentStatus) || !isValidStatus(newStatus)) {
    return false
  }

  const allowedTransitions = validTransitions[currentStatus as AppointmentStatus]
  return allowedTransitions.includes(newStatus as AppointmentStatus)
}

/**
 * 有効なステータスかチェック
 * @param status チェックするステータス
 * @returns 有効な場合true、無効な場合false
 */
export function isValidStatus(status: string): status is AppointmentStatus {
  return ['pending', 'approved', 'rejected', 'cancelled', 'completed'].includes(status)
}

/**
 * ステータスから次に遷移可能なステータス一覧を取得
 * @param currentStatus 現在のステータス
 * @returns 遷移可能なステータスの配列
 */
export function getAvailableTransitions(currentStatus: string): AppointmentStatus[] {
  if (!isValidStatus(currentStatus)) {
    return []
  }

  return validTransitions[currentStatus as AppointmentStatus]
}

/**
 * ステータスの日本語ラベルを取得
 * @param status ステータス
 * @returns 日本語ラベル
 */
export function getStatusLabel(status: string): string {
  const labels: Record<AppointmentStatus, string> = {
    pending: '承認待ち',
    approved: '承認済み',
    rejected: '拒否',
    cancelled: 'キャンセル',
    completed: '完了',
  }

  return labels[status as AppointmentStatus] || status
}
