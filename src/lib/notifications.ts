import { createClient } from '@/utils/supabase/server'

/**
 * アプリ内通知を作成
 */
export async function createNotification(
  userId: string,
  type: 'appointment_requested' | 'appointment_approved' | 'appointment_rejected' | 'appointment_cancelled' | 'reminder',
  title: string,
  message: string,
  appointmentId?: string
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      appointment_id: appointmentId,
      is_read: false,
    })

    if (error) {
      console.error('Failed to create notification:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
    }
  } catch (error) {
    console.error('Unexpected error creating notification:', error)
  }
}

/**
 * 未読通知数を取得
 */
export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return count || 0
}

/**
 * ユーザーの最新通知を取得（最大10件）
 */
export async function getRecentNotifications(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }

  return data || []
}
