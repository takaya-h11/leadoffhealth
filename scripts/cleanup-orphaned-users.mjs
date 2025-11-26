#!/usr/bin/env node

/**
 * 孤立したAuth usersをクリーンアップ
 * usersテーブルに存在しないauth.usersのユーザーを削除
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

// .env.localを読み込む
const envContent = readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: 環境変数が設定されていません')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupOrphanedUsers() {
  console.log('🔍 孤立したAuth usersを検索中...\n')

  // 1. すべてのAuth usersを取得
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Auth users取得エラー:', authError)
    process.exit(1)
  }

  console.log(`📊 総Auth users数: ${authUsers.users.length}`)

  // 2. usersテーブルのすべてのIDを取得
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('id')

  if (publicError) {
    console.error('❌ Users table取得エラー:', publicError)
    process.exit(1)
  }

  const publicUserIds = new Set(publicUsers.map(u => u.id))
  console.log(`📊 Public users数: ${publicUsers.length}\n`)

  // 3. 孤立したユーザーを特定
  const orphanedUsers = authUsers.users.filter(
    authUser => !publicUserIds.has(authUser.id)
  )

  if (orphanedUsers.length === 0) {
    console.log('✅ 孤立したユーザーは見つかりませんでした')
    process.exit(0)
  }

  console.log(`⚠️  孤立したユーザーが ${orphanedUsers.length} 件見つかりました:\n`)

  orphanedUsers.forEach((user, index) => {
    console.log(`${index + 1}. ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   作成日時: ${new Date(user.created_at).toLocaleString('ja-JP')}`)
    console.log('')
  })

  // 4. 削除を確認
  console.log('🗑️  これらのユーザーを削除しますか? (y/N)')

  // Node.js 標準入力から確認を取得
  process.stdin.setEncoding('utf8')
  process.stdin.once('data', async (data) => {
    const answer = data.toString().trim().toLowerCase()

    if (answer !== 'y' && answer !== 'yes') {
      console.log('❌ キャンセルしました')
      process.exit(0)
    }

    // 5. 削除実行
    console.log('\n🗑️  削除中...\n')

    let successCount = 0
    let errorCount = 0

    for (const user of orphanedUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) {
        console.log(`❌ 削除失敗: ${user.email} - ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ 削除成功: ${user.email}`)
        successCount++
      }
    }

    console.log(`\n📊 結果:`)
    console.log(`   成功: ${successCount} 件`)
    console.log(`   失敗: ${errorCount} 件`)

    process.exit(0)
  })
}

cleanupOrphanedUsers().catch(error => {
  console.error('❌ 予期しないエラー:', error)
  process.exit(1)
})
