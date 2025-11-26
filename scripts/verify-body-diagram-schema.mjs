#!/usr/bin/env node

/**
 * Verify that body_diagram_data column exists in treatment_records table
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySchema() {
  console.log('🔍 Checking treatment_records table schema...\n')

  // Query to check if columns exist
  const { data, error } = await supabase
    .from('treatment_records')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error querying treatment_records:', error.message)
    return false
  }

  // Check column existence via information_schema
  const { data: columns, error: schemaError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'treatment_records'
        AND column_name IN ('body_diagram_data', 'body_diagram_image_url')
      ORDER BY column_name;
    `
  })

  if (schemaError) {
    console.log('⚠️  Could not query schema directly, trying alternate method...\n')

    // Try to insert test data to see if column exists
    const testRecordId = crypto.randomUUID()
    const { error: testError } = await supabase
      .from('treatment_records')
      .insert({
        id: testRecordId,
        body_diagram_data: { test: true }
      })

    if (testError) {
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.error('❌ body_diagram_data column DOES NOT EXIST in treatment_records table')
        console.error('   Error:', testError.message)
        console.log('\n📝 You need to apply the migration:')
        console.log('   Run: node scripts/apply-migration.mjs')
        return false
      } else {
        console.log('ℹ️  Got expected error (missing required fields):', testError.message)
        console.log('✅ body_diagram_data column EXISTS (insert failed for other reasons)\n')
      }
    }
  } else {
    console.log('📊 Schema Information:\n')
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`  ✓ ${col.column_name}`)
        console.log(`    Type: ${col.data_type}`)
        console.log(`    Nullable: ${col.is_nullable}`)
        console.log()
      })
    } else {
      console.error('❌ Columns NOT FOUND in schema')
      console.log('\n📝 You need to apply the migration:')
      console.log('   Run: node scripts/apply-migration.mjs')
      return false
    }
  }

  // Check RLS policies
  console.log('\n🔒 Checking RLS policies for treatment_records...\n')

  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        polname as policy_name,
        polcmd as command,
        CASE polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
        END as operation,
        pg_get_expr(polqual, polrelid) as using_expression,
        pg_get_expr(polwithcheck, polrelid) as with_check_expression
      FROM pg_policy
      WHERE polrelid = 'public.treatment_records'::regclass
      ORDER BY polname;
    `
  })

  if (policyError) {
    console.log('⚠️  Could not query RLS policies:', policyError.message)
  } else if (policies && policies.length > 0) {
    console.log('📋 Active RLS Policies:\n')
    policies.forEach(policy => {
      console.log(`  Policy: ${policy.policy_name}`)
      console.log(`  Operation: ${policy.operation}`)
      if (policy.using_expression) {
        console.log(`  Using: ${policy.using_expression}`)
      }
      if (policy.with_check_expression) {
        console.log(`  With Check: ${policy.with_check_expression}`)
      }
      console.log()
    })
  } else {
    console.log('ℹ️  No RLS policies found (or RLS is disabled)')
  }

  // Try a test query
  console.log('\n🧪 Testing actual data retrieval...\n')

  const { data: testData, error: testQueryError } = await supabase
    .from('treatment_records')
    .select('id, body_diagram_data')
    .not('body_diagram_data', 'is', null)
    .limit(1)

  if (testQueryError) {
    console.error('❌ Error querying body_diagram_data:', testQueryError.message)
  } else if (testData && testData.length > 0) {
    console.log('✅ Found records with body_diagram_data:')
    console.log(`   Record ID: ${testData[0].id}`)
    console.log(`   Has data: ${testData[0].body_diagram_data ? 'Yes' : 'No'}`)
  } else {
    console.log('ℹ️  No records found with body_diagram_data (this is normal if none have been saved yet)')
  }

  console.log('\n✅ Schema verification complete!')
  return true
}

// Note: Supabase doesn't have a built-in exec_sql RPC by default
// We need to check if column exists differently

async function verifySchemaSimple() {
  console.log('🔍 Verifying body_diagram_data column exists...\n')

  try {
    // Try to query the column - if it doesn't exist, we'll get an error
    const { data, error } = await supabase
      .from('treatment_records')
      .select('id, body_diagram_data')
      .limit(1)

    if (error) {
      if (error.message.includes('column') && error.message.includes('body_diagram_data')) {
        console.error('❌ COLUMN DOES NOT EXIST: body_diagram_data')
        console.error('   Error:', error.message)
        console.log('\n📝 SOLUTION: Apply the migration')
        console.log('   Run: node scripts/apply-migration.mjs\n')
        return false
      } else {
        console.error('❌ Unexpected error:', error)
        return false
      }
    }

    console.log('✅ Column EXISTS: body_diagram_data')

    // Check if any records have this data
    const { data: recordsWithData, error: countError } = await supabase
      .from('treatment_records')
      .select('id, body_diagram_data', { count: 'exact' })
      .not('body_diagram_data', 'is', null)

    if (!countError) {
      const count = recordsWithData?.length || 0
      console.log(`ℹ️  Records with body diagram data: ${count}`)

      if (count > 0 && recordsWithData) {
        console.log('\n📊 Sample data:')
        console.log(JSON.stringify(recordsWithData[0].body_diagram_data, null, 2))
      }
    }

    console.log('\n✅ Verification complete!')
    return true

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return false
  }
}

verifySchemaSimple()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
