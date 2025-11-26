import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { generateSecurePassword } from '@/utils/password'

/**
 * 管理者による法人担当者の初期パスワード再発行
 *
 * POST /api/admin/users/[userId]/reset-password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    // 1. 現在のユーザーが管理者かチェック
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUserData } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (currentUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
    }

    // 2. 対象ユーザーの情報を取得
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role, company_id, companies(name)')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. 法人担当者のみ対象（整体師や管理者は対象外）
    if (targetUser.role !== 'company_user') {
      return NextResponse.json(
        { error: 'Password reset is only available for company users' },
        { status: 400 }
      )
    }

    // 4. 新しい初期パスワードを生成
    const newPassword = generateSecurePassword(12)

    // 5. Supabase Admin APIでパスワードを更新
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Failed to update password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // 6. must_change_password フラグをtrueに設定
    const { error: dbError } = await supabase
      .from('users')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (dbError) {
      console.error('Failed to update must_change_password flag:', dbError)
      // パスワードは更新されたので、フラグの更新失敗は警告のみ
    }

    // 7. パスワードを返す（管理者が手動で伝える）
    return NextResponse.json({
      success: true,
      password: newPassword,
      userEmail: targetUser.email,
      userName: targetUser.full_name,
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
