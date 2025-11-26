#!/usr/bin/env node

/**
 * redirect()のメッセージパラメータをURLエンコードするスクリプト
 *
 * 問題: redirect('/path?message=日本語') は Next.js 15 でヘッダーエラーを引き起こす
 * 解決: redirect('/path?message=' + encodeURIComponent('日本語'))
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.join(__dirname, '..')
const srcDir = path.join(rootDir, 'src')

let fixedCount = 0
let filesChecked = 0

function hasJapanese(str) {
  return /[\u3000-\u9FFF]/.test(str)
}

function fixRedirectInFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return
  }

  filesChecked++
  const content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  let newContent = content

  // Pattern 1: redirect('/path?message=日本語')
  // Pattern 2: redirect(`/path?message=日本語`)
  // Pattern 3: redirect(`/path?message=${variable}日本語`)

  const patterns = [
    // redirect('/path?message=日本語')
    /redirect\('([^']*\?message=)([^']+)'\)/g,
    // redirect("/path?message=日本語")
    /redirect\("([^"]*\?message=)([^"]+)"\)/g,
    // redirect(`/path?message=日本語`)
    /redirect\(`([^`]*\?message=)([^`$]+)`\)/g,
  ]

  patterns.forEach(pattern => {
    newContent = newContent.replace(pattern, (match, prefix, message) => {
      // メッセージに日本語が含まれているかチェック
      if (hasJapanese(message)) {
        // 既にencodeURIComponentが使われているかチェック
        if (match.includes('encodeURIComponent')) {
          return match
        }

        // ${...}が含まれている場合（テンプレートリテラル）
        if (message.includes('${')) {
          // encodeURIComponentでラップ
          const fixed = `redirect(${match.includes('`') ? '`' : "'"}${prefix}\${encodeURIComponent(${message})}${match.includes('`') ? '`' : "'"})`
          console.log(`  Fixed template literal: ${filePath}`)
          console.log(`    Before: ${match}`)
          console.log(`    After:  ${fixed}`)
          modified = true
          fixedCount++
          return fixed
        }

        // 通常の文字列リテラル
        const quote = match.includes('`') ? '`' : match.includes('"') ? '"' : "'"
        const fixed = `redirect(${quote}${prefix}${quote} + encodeURIComponent(${quote}${message}${quote}))`
        console.log(`  Fixed: ${filePath}`)
        console.log(`    Before: ${match}`)
        console.log(`    After:  ${fixed}`)
        modified = true
        fixedCount++
        return fixed
      }
      return match
    })
  })

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8')
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // node_modules, .next などをスキップ
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath)
      }
    } else {
      fixRedirectInFile(filePath)
    }
  })
}

console.log('🔍 Checking for redirect() with Japanese characters...\n')
walkDir(srcDir)

console.log(`\n✅ Done!`)
console.log(`   Files checked: ${filesChecked}`)
console.log(`   Redirects fixed: ${fixedCount}`)
