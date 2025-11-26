#!/usr/bin/env node

/**
 * Simple verification script to check if body_diagram_data column exists
 * Uses Next.js env loading
 */

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from .env.local
async function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envFile = await readFile(envPath, 'utf-8')
    const env = {}

    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        env[key] = value
      }
    })

    return env
  } catch (err) {
    console.error('Could not load .env.local:', err.message)
    return {}
  }
}

async function verify() {
  console.log('🔍 Checking body_diagram_data column...\n')

  const env = await loadEnv()
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Found' : '✗ Missing')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Found' : '✗ Missing')
    console.log('\n📝 Make sure your .env.local file contains these variables')
    process.exit(1)
  }

  console.log('✓ Environment variables loaded')
  console.log(`  Supabase URL: ${supabaseUrl}`)
  console.log(`  Service key: ${supabaseServiceKey.substring(0, 20)}...`)
  console.log()

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Test 1: Try to query the column
  console.log('Test 1: Querying body_diagram_data column...')
  const { data, error } = await supabase
    .from('treatment_records')
    .select('id, body_diagram_data')
    .limit(1)

  if (error) {
    if (error.message.toLowerCase().includes('body_diagram_data') &&
        error.message.toLowerCase().includes('does not exist')) {
      console.error('❌ COLUMN DOES NOT EXIST!')
      console.error('   Error:', error.message)
      console.log('\n📝 SOLUTION: Apply the migration')
      console.log('   1. Make sure you have a Supabase project linked')
      console.log('   2. Run: npx supabase migration up')
      console.log('   OR manually execute: scripts/apply-body-diagram-migration.sql')
      process.exit(1)
    } else {
      console.error('❌ Query error:', error.message)
      console.error('   Code:', error.code)
      process.exit(1)
    }
  }

  console.log('✅ Column exists!\n')

  // Test 2: Count records with body diagram data
  console.log('Test 2: Checking for existing body diagram data...')
  const { data: records, count, error: countError } = await supabase
    .from('treatment_records')
    .select('id, appointment_id, body_diagram_data', { count: 'exact' })
    .not('body_diagram_data', 'is', null)

  if (countError) {
    console.error('⚠️  Could not count records:', countError.message)
  } else {
    console.log(`   Found ${count || 0} records with body diagram data`)

    if (records && records.length > 0) {
      console.log('\n📊 Sample record:')
      const sample = records[0]
      console.log(`   Record ID: ${sample.id}`)
      console.log(`   Appointment ID: ${sample.appointment_id}`)
      console.log(`   Data preview: ${JSON.stringify(sample.body_diagram_data).substring(0, 100)}...`)
    }
  }

  // Test 3: Check all records
  console.log('\nTest 3: Checking all treatment records...')
  const { data: allRecords, error: allError } = await supabase
    .from('treatment_records')
    .select('id, appointment_id, body_diagram_data')
    .order('created_at', { ascending: false })
    .limit(10)

  if (allError) {
    console.error('⚠️  Could not query records:', allError.message)
  } else {
    console.log(`   Total records checked: ${allRecords?.length || 0}`)

    if (allRecords) {
      const withData = allRecords.filter(r => r.body_diagram_data !== null)
      const withoutData = allRecords.filter(r => r.body_diagram_data === null)

      console.log(`   - With body diagram: ${withData.length}`)
      console.log(`   - Without body diagram: ${withoutData.length}`)

      if (withoutData.length > 0) {
        console.log('\n   Recent records WITHOUT body diagram data:')
        withoutData.slice(0, 3).forEach(r => {
          console.log(`     - ${r.id} (appointment: ${r.appointment_id})`)
        })
      }
    }
  }

  console.log('\n✅ Verification complete!')
  console.log('\n💡 Next steps to debug:')
  console.log('   1. Check browser console for errors when submitting form')
  console.log('   2. Check server logs for body_diagram_data parsing errors')
  console.log('   3. Verify form is calling handleBodyDiagramSave correctly')
  console.log('   4. Ensure bodyDiagramData state is populated before submit')
}

verify()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n💥 Fatal error:', err)
    process.exit(1)
  })
