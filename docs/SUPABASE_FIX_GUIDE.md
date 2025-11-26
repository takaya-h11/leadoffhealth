# ユーザーロール問題の修正ガイド

## 問題

ログイン時に「ユーザーロールが見つかりません」というエラーが表示される。

### 原因

`auth.users`テーブルにユーザーレコードが存在するが、`public.users`テーブルにレコードが存在しないため。

## 解決方法

以下の手順でSupabase SQL Editorを使ってSQLを実行します。

### 手順1: Supabase SQL Editorを開く

1. ブラウザで以下のURLにアクセス:
   ```
   https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql/new
   ```

2. Supabaseにログインしていない場合はログインしてください

### 手順2: SQLを実行

1. 以下のファイルの内容をコピー:
   ```
   docs/fix-user-role-issue.sql
   ```

2. SQL Editorにペースト

3. 右下の「RUN」ボタンをクリック

4. 実行が完了するまで待つ（数秒）

### 手順3: 確認

SQLの最後に確認クエリが含まれているので、以下のような結果が表示されるはずです:

**auth.users の確認結果:**
```
id                                   | email                  | created_at
-------------------------------------|------------------------|---------------------------
00000000-0000-0000-0000-000000000101 | admin@demo.com        | 2025-XX-XX XX:XX:XX
00000000-0000-0000-0000-000000000102 | therapist@demo.com    | 2025-XX-XX XX:XX:XX
00000000-0000-0000-0000-000000000103 | company@demo.com      | 2025-XX-XX XX:XX:XX
```

**public.users の確認結果:**
```
id                                   | email              | full_name      | role         | company_id | is_active
-------------------------------------|--------------------| ---------------|--------------|------------|----------
00000000-0000-0000-0000-000000000101 | admin@demo.com     | 管理者 太郎     | admin        | NULL       | true
00000000-0000-0000-0000-000000000102 | therapist@demo.com | 整体師 花子     | therapist    | NULL       | true
00000000-0000-0000-0000-000000000103 | company@demo.com   | 法人担当 次郎   | company_user | 100001     | true
```

### 手順4: ログインテスト

1. アプリケーション（http://localhost:3000）を開く

2. 開発サーバーが起動していない場合は起動:
   ```bash
   npm run dev
   ```

3. ログインページで「デモログイン」ボタンを使ってログイン:
   - **管理者としてログイン** → 管理者ダッシュボードにリダイレクト
   - **整体師としてログイン** → 整体師ダッシュボードにリダイレクト
   - **法人担当者としてログイン** → 法人ダッシュボードにリダイレクト

4. または手動でログイン:
   - メール: `admin@demo.com`
   - パスワード: `demo123`

## 修正内容の説明

このSQLスクリプトは3つのことを行います:

### 1. 自動作成トリガーの設定

今後、新しいユーザーが`auth.users`に作成されたときに、自動的に`public.users`にもレコードが作成されるようにトリガーを設定します。

### 2. デモユーザーの作成

3つのデモユーザーを`auth.users`テーブルに作成します:
- 管理者: `admin@demo.com`
- 整体師: `therapist@demo.com`
- 法人担当者: `company@demo.com`

全てパスワードは `demo123` です。

### 3. public.usersレコードの作成

デモユーザーの詳細情報を`public.users`テーブルに作成します。

## トラブルシューティング

### エラー: "relation "auth.users" does not exist"

→ Supabaseプロジェクトが正しく選択されているか確認してください。

### エラー: "permission denied for table auth.users"

→ SQL Editorで実行する必要があります。通常のクライアントからは`auth.users`にアクセスできません。

### ログインできるがロールエラーが出る

1. `public.users`テーブルを確認:
   ```sql
   SELECT * FROM public.users WHERE email = 'admin@demo.com';
   ```

2. レコードが存在しない場合、STEP 3のみを再実行:
   ```sql
   INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
   VALUES
     ('00000000-0000-0000-0000-000000000101', 'admin@demo.com', '管理者 太郎', 'admin', NULL, '090-1111-1111', true, false)
   ON CONFLICT (id) DO UPDATE SET
     role = EXCLUDED.role;
   ```

## 今後の新規ユーザー作成

トリガーが設定されているので、今後は:

1. Supabase Authで通常通りユーザーを作成
2. 自動的に`public.users`にレコードが作成される
3. ただし、ロールは`metadata`に設定する必要がある

サインアップ時にメタデータを設定する例:
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'ユーザー名',
      role: 'company_user'
    }
  }
})
```

## 参考

- Supabaseダッシュボード: https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru
- SQL Editor: https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql/new
- Table Editor (users): https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/editor
