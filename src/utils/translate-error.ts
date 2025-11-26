/**
 * Supabase Authのエラーメッセージを日本語に翻訳
 */
export function translateAuthError(message: string): string {
  // メッセージが既に日本語の場合はそのまま返す
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(message)) {
    return message
  }

  const errorMap: { [key: string]: string } = {
    // パスワードリセット関連
    'Email link is invalid or has expired': 'メールリンクが無効または期限切れです',
    'Invalid email or password': 'メールアドレスまたはパスワードが正しくありません',
    'Email not confirmed': 'メールアドレスが確認されていません',
    'Invalid login credentials': 'ログイン情報が正しくありません',
    'User not found': 'ユーザーが見つかりません',
    'Password should be at least 6 characters': 'パスワードは6文字以上である必要があります',

    // セッション関連
    'Auth session missing': '認証セッションがありません',
    'Session expired': 'セッションが期限切れです',
    'Session not found': 'セッションが見つかりません',

    // 認証関連
    'Authentication failed': '認証に失敗しました',
    'Could not authenticate user': 'ユーザーを認証できませんでした',
    'Could not create user': 'ユーザーを作成できませんでした',
    'Signup requires a valid password': '有効なパスワードを入力してください',

    // メール関連
    'Check email to continue sign in process': 'メールを確認してサインインを完了してください',
    'Check your email for the reset link': 'パスワードリセット用のリンクをメールで送信しました',
    'Unable to validate email address': 'メールアドレスを検証できませんでした',
    'Email address is invalid': 'メールアドレスが無効です',

    // パスワード更新
    'Password updated successfully': 'パスワードを更新しました',
    'Failed to update password': 'パスワードの更新に失敗しました',
    'Passwords do not match': 'パスワードが一致しません',
    'Password must be at least 6 characters': 'パスワードは6文字以上である必要があります',
    'New password should be different from the old password': '新しいパスワードは現在のパスワードと異なる必要があります',

    // トークン関連
    'Token has expired or is invalid': 'トークンが無効または期限切れです',
    'Invalid token': 'トークンが無効です',
    'invalid claim': '認証情報が無効です',
    'Invalid refresh token': 'リフレッシュトークンが無効です',

    // OTP関連
    'Token expired': 'トークンの有効期限が切れています',
    'OTP expired': 'ワンタイムパスワードの有効期限が切れています',

    // その他
    'Email rate limit exceeded': 'メール送信の上限に達しました。しばらく時間をおいてから再度お試しください',
    'For security purposes, you can only request this once every 60 seconds': 'セキュリティ上の理由により、60秒に1回のみリクエスト可能です',
    'Database error': 'データベースエラーが発生しました',
    'Unexpected error': '予期しないエラーが発生しました',
  }

  // 完全一致を確認
  if (errorMap[message]) {
    return errorMap[message]
  }

  // 部分一致を確認
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value
    }
  }

  // 翻訳が見つからない場合は元のメッセージを返す
  return message
}
