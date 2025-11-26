import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 空き枠の情報を取得
    const { data: slot } = await supabase
      .from('available_slots')
      .select('*, therapists!inner(user_id)')
      .eq('id', id)
      .single()

    if (!slot) {
      return NextResponse.json({ error: '空き枠が見つかりません' }, { status: 404 })
    }

    // 整体師本人または管理者のみ削除可能
    const therapistUserId = Array.isArray(slot.therapists)
      ? slot.therapists[0]?.user_id
      : slot.therapists?.user_id

    if (userProfile?.role !== 'admin' && therapistUserId !== user.id) {
      return NextResponse.json({ error: '他の整体師の空き枠は削除できません' }, { status: 403 })
    }

    // 予約が入っている場合は削除不可
    if (slot.status !== 'available') {
      return NextResponse.json(
        { error: '予約が入っている空き枠は削除できません' },
        { status: 400 }
      )
    }

    // 削除実行
    const { error } = await supabase
      .from('available_slots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('空き枠削除エラー:', error)
      return NextResponse.json(
        { error: '空き枠の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '削除しました' }, { status: 200 })
  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報を取得
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 空き枠の情報を取得
    const { data: slot } = await supabase
      .from('available_slots')
      .select('*, therapists!inner(user_id)')
      .eq('id', id)
      .single()

    if (!slot) {
      return NextResponse.json({ error: '空き枠が見つかりません' }, { status: 404 })
    }

    // 整体師本人または管理者のみ編集可能
    const therapistUserId = Array.isArray(slot.therapists)
      ? slot.therapists[0]?.user_id
      : slot.therapists?.user_id

    if (userProfile?.role !== 'admin' && therapistUserId !== user.id) {
      return NextResponse.json({ error: '他の整体師の空き枠は編集できません' }, { status: 403 })
    }

    // 予約が入っている場合は編集不可
    if (slot.status !== 'available') {
      return NextResponse.json(
        { error: '予約が入っている空き枠は編集できません' },
        { status: 400 }
      )
    }

    // リクエストボディを取得
    const body = await request.json()
    const { service_menu_id, start_time, end_time } = body

    // バリデーション
    if (!service_menu_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    // 開始時刻が終了時刻より前かチェック
    if (new Date(start_time) >= new Date(end_time)) {
      return NextResponse.json(
        { error: '終了時刻は開始時刻より後である必要があります' },
        { status: 400 }
      )
    }

    // 過去の日時でないかチェック
    if (new Date(start_time) < new Date()) {
      return NextResponse.json(
        { error: '過去の日時は登録できません' },
        { status: 400 }
      )
    }

    // 重複する空き枠がないかチェック（自分自身は除外）
    const { data: existingSlots } = await supabase
      .from('available_slots')
      .select('id')
      .eq('therapist_id', slot.therapist_id)
      .neq('id', id)
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`)

    if (existingSlots && existingSlots.length > 0) {
      return NextResponse.json(
        { error: '指定された時間帯に既に空き枠が存在します' },
        { status: 400 }
      )
    }

    // 更新実行
    const { data: updatedSlot, error } = await supabase
      .from('available_slots')
      .update({
        service_menu_id,
        start_time,
        end_time,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('空き枠更新エラー:', error)
      return NextResponse.json(
        { error: '空き枠の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedSlot, { status: 200 })
  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
