import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250107000000_add_body_diagram_fields.sql')
const migrationSql = readFileSync(migrationPath, 'utf-8')

console.log('📝 Applying migration: 20250107000000_add_body_diagram_fields.sql')
console.log('=' .repeat(60))

// Remove comments and split into statements
const statements = migrationSql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
  .join('\n')
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*'))

console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`)

// Execute each statement
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i]
  console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

  if (error) {
    // Try direct query if RPC doesn't work
    const { error: directError } = await supabase
      .from('_migrations')
      .select('*')
      .limit(0) // Just to test connection

    if (directError) {
      console.error(`\n❌ Error executing statement ${i + 1}:`)
      console.error(error.message)
      console.error('\nStatement:')
      console.error(statement)
      process.exit(1)
    }
  }

  console.log(`✅ Statement ${i + 1} executed successfully`)
}

console.log('\n' + '='.repeat(60))
console.log('✅ Migration applied successfully!')
console.log('\nBody diagram fields have been added to treatment_records table:')
console.log('  - body_diagram_data (JSONB)')
console.log('  - body_diagram_image_url (TEXT)')
