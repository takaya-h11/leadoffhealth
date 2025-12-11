'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionResult = {
  success: boolean
  message?: string
}

/**
 * 空き枠を新規登録
 */
export async function createAvailableSlot(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: '認証が必要です' }
    }

    // 整体師権限確認
    const { data: userProfile } = await supabase
      .from('users')
      .select(`
        role,
        therapists (
          id
        )
      `)
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
      return { success: false, message: '権限がありません' }
    }

    // フォームデータ取得
    const therapistId = formData.get('therapist_id') as string
    const serviceMenuId = formData.get('service_menu_id') as string
    const companyId = formData.get('company_id') as string | null
    const startDate = formData.get('start_date') as string
    const startHour = formData.get('start_hour') as string
    const startMinute = formData.get('start_minute') as string
    const endHour = formData.get('end_hour') as string
    const endMinute = formData.get('end_minute') as string

    // バリデーション
    if (!therapistId || !serviceMenuId || !startDate || !startHour || !startMinute || !endHour || !endMinute) {
      return { success: false, message: 'すべての項目を入力してください' }
    }

    // 日時の組み立て
    const startTime = `${startHour}:${startMinute}`
    const endTime = `${endHour}:${endMinute}`
    const startDateTime = new Date(`${startDate}T${startTime}:00`)
    const endDateTime = new Date(`${startDate}T${endTime}:00`)

    // 日時の妥当性チェック
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return { success: false, message: '日付または時刻が無効です' }
    }

    if (endDateTime <= startDateTime) {
      return { success: false, message: '終了時刻は開始時刻より後の時刻を指定してください' }
    }

    // 過去の日時チェック
    const now = new Date()
    if (startDateTime < now) {
      return { success: false, message: '過去の日時は登録できません' }
    }

    // 施術メニューの時間チェック
    const { data: serviceMenu } = await supabase
      .from('service_menus')
      .select('duration_minutes, name')
      .eq('id', serviceMenuId)
      .single()

    if (!serviceMenu) {
      return { success: false, message: '施術メニューが見つかりません' }
    }

    // 実際の時間枠の長さを計算（分単位）
    const actualDuration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    // 施術メニューの時間と一致するかチェック
    if (actualDuration !== serviceMenu.duration_minutes) {
      return {
        success: false,
        message: `入力された時間（${actualDuration}分）が施術メニュー「${serviceMenu.name}」の時間（${serviceMenu.duration_minutes}分）と一致しません`,
      }
    }

    // 重複チェック（同じ整体師の同じ時間帯に既に枠がないか）
    const { data: overlapping } = await supabase
      .from('available_slots')
      .select('id')
      .eq('therapist_id', therapistId)
      .neq('status', 'cancelled')
      .or(`and(start_time.lte.${endDateTime.toISOString()},end_time.gte.${startDateTime.toISOString()})`)
      .limit(1)

    if (overlapping && overlapping.length > 0) {
      return { success: false, message: '指定した時間帯は既に登録されている枠と重複しています' }
    }

    // 自動削除日時を設定（施術日時から1週間後）
    const autoDeleteAt = new Date(startDateTime)
    autoDeleteAt.setDate(autoDeleteAt.getDate() + 7)

    const { error } = await supabase
      .from('available_slots')
      .insert({
        therapist_id: therapistId,
        service_menu_id: serviceMenuId,
        company_id: companyId || null, // 空文字列の場合はnullに変換
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'available',
        auto_delete_at: autoDeleteAt.toISOString(),
      })

    if (error) {
      console.error('Slot creation error:', error)
      return { success: false, message: `空き枠登録エラー: ${error.message}` }
    }

    // キャッシュを再検証
    revalidatePath('/therapist/slots')

    // 成功
    return { success: true, message: '空き枠を登録しました' }
  } catch (error) {
    // その他のエラーはログ出力
    console.error('Unexpected error in createAvailableSlot:', error)
    return { success: false, message: '予期しないエラーが発生しました' }
  }
}

/**
 * 空き枠を削除
 */
export async function deleteAvailableSlot(slotId: string) {
  const supabase = await createClient()

  // 認証確認
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 整体師または管理者権限確認
  const { data: userProfile } = await supabase
    .from('users')
    .select(`
      role,
      therapists (
        id
      )
    `)
    .eq('id', user.id)
    .single()

  const isAdmin = userProfile?.role === 'admin'
  const isTherapist = userProfile?.role === 'therapist'

  if (!isAdmin && !isTherapist) {
    redirect('/dashboard?message=No+permission')
  }

  const redirectPath = isAdmin ? '/admin/slots' : '/therapist/slots'

  // therapistデータを取得（整体師または管理者が整体師としても登録されている場合）
  let therapistData = null
  if (userProfile.therapists) {
    therapistData = Array.isArray(userProfile.therapists)
      ? userProfile.therapists[0]
      : userProfile.therapists

    // 整体師の場合はtherapistデータが必須
    if (isTherapist && !therapistData) {
      redirect(`${redirectPath}?message=Therapist+info+not+found`)
    }
  }

  try {
    // 削除対象の枠を取得
    const { data: slot } = await supabase
      .from('available_slots')
      .select('therapist_id, status, start_time')
      .eq('id', slotId)
      .single()

    if (!slot) {
      redirect(`${redirectPath}?message=Slot+not+found`)
    }

    // 整体師の場合、自分の枠かチェック
    if (isTherapist && therapistData && slot.therapist_id !== therapistData.id) {
      redirect(`${redirectPath}?message=Cannot+delete+other+therapist+slots`)
    }

    // available状態かチェック
    if (slot.status !== 'available') {
      redirect(`${redirectPath}?message=Cannot+delete+booked+slot`)
    }

    // 過去の枠かチェック
    const startTime = new Date(slot.start_time)
    const now = new Date()
    if (startTime < now) {
      redirect(`${redirectPath}?message=Cannot+delete+past+slot`)
    }

    // 削除実行
    const { error } = await supabase
      .from('available_slots')
      .delete()
      .eq('id', slotId)

    if (error) {
      console.error('Slot deletion error:', error)

      // 外部キー制約エラー（予約が存在する）の場合
      if (error.code === '23503') {
        redirect(`${redirectPath}?message=Cannot+delete+slot+with+appointments`)
      }

      redirect(`${redirectPath}?message=Slot+deletion+failed`)
    }

    // 成功
    redirect(`${redirectPath}?message=Slot+deleted+successfully`)
  } catch (error) {
    // redirect()は内部的に例外をスローするので、それを再スロー
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    // 本当のエラーの場合のみログ出力
    console.error('Unexpected error:', error)
    redirect(`${redirectPath}?message=Unexpected+error+occurred`)
  }
}
