import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local')
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  console.error('You can find it in: Supabase Dashboard > Settings > API > service_role key')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250113000000_fix_slot_id_unique_constraint.sql')
const migrationSql = readFileSync(migrationPath, 'utf-8')

console.log('📝 Applying migration: 20250113000000_fix_slot_id_unique_constraint.sql')
console.log('=' .repeat(60))
console.log('\nThis migration will:')
console.log('  1. Remove the UNIQUE constraint on appointments.slot_id')
console.log('  2. Add a partial unique index that only applies to non-cancelled appointments')
console.log('  3. Allow re-booking of cancelled slots')
console.log('')

// Remove comments and split into statements
const statements = migrationSql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
  .join('\n')
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'))

console.log(`📊 Found ${statements.length} SQL statements to execute\n`)

// Execute each statement directly using Supabase client
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i]
  console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
  console.log(`   ${statement.substring(0, 80)}${statement.length > 80 ? '...' : ''}`)

  try {
    // Use the postgres client directly for DDL operations
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: statement + ';'
    })

    if (error) {
      console.error(`\n❌ Error executing statement ${i + 1}:`)
      console.error(error.message)
      console.error('\nStatement:')
      console.error(statement)
      console.error('\nNote: You may need to run this SQL directly in the Supabase SQL Editor:')
      console.error('https://supabase.com/dashboard/project/_/sql/new')
      process.exit(1)
    }

    console.log(`✅ Statement ${i + 1} executed successfully`)
  } catch (err) {
    console.error(`\n❌ Unexpected error:`)
    console.error(err.message)
    console.error('\nNote: You may need to run this SQL directly in the Supabase SQL Editor:')
    console.error('https://supabase.com/dashboard/project/_/sql/new')
    process.exit(1)
  }
}

console.log('\n' + '='.repeat(60))
console.log('✅ Migration applied successfully!')
console.log('\nChanges made:')
console.log('  - Removed UNIQUE constraint on appointments.slot_id')
console.log('  - Added partial unique index: appointments_slot_id_active_unique')
console.log('  - Now you can re-book cancelled appointment slots')
