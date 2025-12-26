import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザー情報と整体師情報を取得
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'therapist' && userProfile?.role !== 'admin') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    // 整体師IDを取得
    const { data: therapist } = await supabase
      .from('therapists')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!therapist) {
      return NextResponse.json({ error: '整体師情報が見つかりません' }, { status: 404 })
    }

    // リクエストボディを取得
    const body = await request.json()
    const { service_menu_id, company_id, start_time, end_time } = body

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

    // 重複する空き枠がないかチェック（同じ整体師、同じ時間帯）
    const { data: existingSlots } = await supabase
      .from('available_slots')
      .select('id')
      .eq('therapist_id', therapist.id)
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time}),and(start_time.gte.${start_time},end_time.lte.${end_time})`)

    if (existingSlots && existingSlots.length > 0) {
      return NextResponse.json(
        { error: '指定された時間帯に既に空き枠が存在します' },
        { status: 400 }
      )
    }

    // 空き枠を作成
    const { data: newSlot, error } = await supabase
      .from('available_slots')
      .insert({
        therapist_id: therapist.id,
        service_menu_id,
        company_id: company_id || null,
        start_time,
        end_time,
        status: 'available',
      })
      .select()
      .single()

    if (error) {
      console.error('空き枠作成エラー:', error)
      return NextResponse.json(
        { error: '空き枠の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(newSlot, { status: 201 })
  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
