# 001: Supabase Project Setup

## 概要
Supabaseプロジェクトをセットアップし、Next.jsアプリケーションと連携するための基本設定を行う。

## タスク

### 1. Supabaseプロジェクト作成
- [ ] Supabase（https://supabase.com）でアカウント作成
- [ ] 新規プロジェクト作成
- [ ] プロジェクト名: `leadoffhealth`
- [ ] リージョン選択（推奨: 東京 or 最寄りのリージョン）
- [ ] データベースパスワード設定・保存

### 2. 環境変数設定
- [ ] `.env.local`ファイル作成
- [ ] Supabaseダッシュボードから以下を取得:
  - Project URL（Settings > API）
  - Anon/Public Key（Settings > API）
- [ ] 環境変数を設定:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- [ ] `.env.local`が`.gitignore`に含まれていることを確認

### 3. パッケージインストール
- [ ] `npm install @supabase/supabase-js @supabase/ssr`を実行
- [ ] package.jsonに依存関係が追加されたことを確認

## 完了条件
- [ ] Supabaseプロジェクトが作成されている
- [ ] 環境変数が正しく設定されている
- [ ] 必要なパッケージがインストールされている

## 参考資料
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
