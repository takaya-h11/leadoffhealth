/**
 * Supabase Admin APIを使ってemployeeユーザーを作成するスクリプト
 *
 * 実行方法:
 * 1. .env.local に SUPABASE_SERVICE_ROLE_KEY を追加
 * 2. npx ts-node scripts/create-employee-users-via-api.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!')
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createEmployeeUsers() {
  console.log('Creating employee demo users via Supabase Admin API...\n')

  const users = [
    {
      id: '00000000-0000-0000-0000-000000000104',
      email: 'employee@demo.com',
      password: 'demo123',
      full_name: '次郎さん（デモ利用者）',
      company_id: '100001'
    },
    {
      id: '00000000-0000-0000-0000-000000000105',
      email: 'employee2@demo.com',
      password: 'demo123',
      full_name: '三郎さん（デモ利用者2）',
      company_id: '100002'
    }
  ]

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`)

    // 1. 既存ユーザーを削除（もし存在すれば）
    const { data: existingUser } = await supabase.auth.admin.getUserById(user.id)
    if (existingUser?.user) {
      console.log(`  Deleting existing user...`)
      await supabase.auth.admin.deleteUser(user.id)
    }

    // 2. Admin APIで新規ユーザー作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: 'employee'
      }
    })

    if (authError) {
      console.error(`  ❌ Error creating auth user:`, authError.message)
      continue
    }

    console.log(`  ✅ Auth user created: ${authData.user.id}`)

    // 3. public.usersレコードを作成/更新
    const { error: publicError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'employee',
        company_id: user.company_id,
        is_active: true,
        must_change_password: false
      })

    if (publicError) {
      console.error(`  ❌ Error creating public user:`, publicError.message)
      continue
    }

    console.log(`  ✅ Public user created`)
    console.log('')
  }

  console.log('✅ All employee users created successfully!')
  console.log('\nYou can now login with:')
  console.log('  - employee@demo.com / demo123 (次郎さん, company 100001)')
  console.log('  - employee2@demo.com / demo123 (三郎さん, company 100002)')
}

createEmployeeUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
