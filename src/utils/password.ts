/**
 * セキュアな初期パスワードを生成する
 *
 * @param length パスワードの文字数（デフォルト: 12）
 * @returns 生成されたパスワード
 */
export function generateSecurePassword(length: number = 12): string {
  // 文字セット
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 読みにくいI, Oを除外
  const lowercase = 'abcdefghijkmnopqrstuvwxyz' // 読みにくいl, oを除外
  const numbers = '23456789' // 読みにくい0, 1を除外
  const symbols = '!@#$%&*+-='

  const allChars = uppercase + lowercase + numbers + symbols

  // 必ず各文字種を含むように1文字ずつ選択
  let password = ''
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // 残りの文字をランダムに選択
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // シャッフル（Fisher-Yatesアルゴリズム）
  const passwordArray = password.split('')
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]]
  }

  return passwordArray.join('')
}

/**
 * パスワードの強度をチェック
 *
 * @param password チェックするパスワード
 * @returns エラーメッセージ（問題ない場合はnull）
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'パスワードは8文字以上で設定してください'
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%&*+\-=]/.test(password)

  const strengthCount = [hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length

  if (strengthCount < 3) {
    return 'パスワードは大文字・小文字・数字・記号のうち3種類以上を含める必要があります'
  }

  return null
}
