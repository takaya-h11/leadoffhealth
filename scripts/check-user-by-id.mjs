#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

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

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const userId = process.argv[2]

if (!userId) {
  console.error('使用方法: node check-user-by-id.mjs <user-id>')
  process.exit(1)
}

console.log(`🔍 ユーザーIDで検索: ${userId}\n`)

// 1. public.users
const { data: publicUser, error: publicError } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

console.log('📊 public.users テーブル:')
if (publicError || !publicUser) {
  console.log('   ❌ 見つかりませんでした')
} else {
  console.log(`   ✅ 見つかりました:`)
  console.log(`      Email: ${publicUser.email}`)
  console.log(`      氏名: ${publicUser.full_name}`)
  console.log(`      ロール: ${publicUser.role}`)
  console.log(`      作成日時: ${new Date(publicUser.created_at).toLocaleString('ja-JP')}`)
}
console.log('')

// 2. auth.users
const { data: authUsers } = await supabase.auth.admin.listUsers()
const authUser = authUsers.users.find(u => u.id === userId)

console.log('📊 auth.users テーブル:')
if (!authUser) {
  console.log('   ❌ 見つかりませんでした')
} else {
  console.log(`   ✅ 見つかりました:`)
  console.log(`      Email: ${authUser.email}`)
  console.log(`      作成日時: ${new Date(authUser.created_at).toLocaleString('ja-JP')}`)
}
console.log('')

// 3. 判定
if (!publicUser && authUser) {
  console.log('⚠️  このユーザーは孤立しています（auth.usersにのみ存在）')
  console.log('削除コマンド:')
  console.log(`node -e "import('@supabase/supabase-js').then(({createClient})=>{const s=createClient('${envVars.NEXT_PUBLIC_SUPABASE_URL}','${envVars.SUPABASE_SERVICE_ROLE_KEY}',{auth:{autoRefreshToken:false,persistSession:false}});s.auth.admin.deleteUser('${userId}').then(r=>console.log(r))})"`)
} else if (publicUser && authUser) {
  console.log('✅ ユーザーは正常です（両方に存在）')
} else if (publicUser && !authUser) {
  console.log('⚠️  データの不整合（public.usersにのみ存在）')
}
