#!/usr/bin/env node

/**
 * メールアドレスでユーザーを検索
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUserByEmail(email) {
  console.log(`🔍 メールアドレスで検索: ${email}\n`)

  // 1. usersテーブルを検索
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)

  if (publicError) {
    console.error('❌ Users table検索エラー:', publicError)
    process.exit(1)
  }

  console.log('📊 public.users テーブル:')
  if (publicUsers.length === 0) {
    console.log('   ❌ ユーザーが見つかりませんでした\n')
  } else {
    publicUsers.forEach(user => {
      console.log(`   ✅ 見つかりました:`)
      console.log(`      ID: ${user.id}`)
      console.log(`      氏名: ${user.full_name}`)
      console.log(`      ロール: ${user.role}`)
      console.log(`      有効: ${user.is_active}`)
      console.log(`      作成日時: ${new Date(user.created_at).toLocaleString('ja-JP')}`)
      console.log('')
    })
  }

  // 2. auth.usersを検索
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Auth users検索エラー:', authError)
    process.exit(1)
  }

  const authUser = authUsers.users.find(u => u.email === email)

  console.log('📊 auth.users テーブル:')
  if (!authUser) {
    console.log('   ❌ ユーザーが見つかりませんでした\n')
  } else {
    console.log(`   ✅ 見つかりました:`)
    console.log(`      ID: ${authUser.id}`)
    console.log(`      Email: ${authUser.email}`)
    console.log(`      作成日時: ${new Date(authUser.created_at).toLocaleString('ja-JP')}`)
    console.log('')
  }

  // 3. 不一致を確認
  if (publicUsers.length > 0 && authUser && publicUsers[0].id !== authUser.id) {
    console.log('⚠️  警告: public.users と auth.users の ID が一致しません！')
    console.log(`   public.users ID: ${publicUsers[0].id}`)
    console.log(`   auth.users ID: ${authUser.id}`)
    console.log('')
  }
}

const email = process.argv[2]

if (!email) {
  console.error('使用方法: node check-user-by-email.mjs <email>')
  console.error('例: node check-user-by-email.mjs test@example.com')
  process.exit(1)
}

checkUserByEmail(email).catch(error => {
  console.error('❌ 予期しないエラー:', error)
  process.exit(1)
})
