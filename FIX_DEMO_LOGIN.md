# デモアカウントのログイン問題の修正方法

## 問題
デモアカウント（管理者、整体師、法人担当者）でログインできなくなった。

## 原因
`must_change_password`フラグが`true`になっているため、ログイン後にパスワード変更画面にリダイレクトされてしまう。

## 修正手順

### 方法1: Supabase SQL Editorで実行（推奨）

1. Supabase Dashboardにアクセス
2. SQL Editorを開く
3. 以下のSQLを実行:

```sql
UPDATE public.users
SET must_change_password = false
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');
```

4. 確認用クエリを実行:

```sql
SELECT id, email, role, must_change_password, is_active
FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY role;
```

### 方法2: Supabase CLIで実行

```bash
npx supabase db execute --file fix_demo_users.sql
```

## デモアカウント情報

- **管理者**: admin@demo.com / demo123
- **整体師**: therapist@demo.com / demo123
- **法人担当者**: company@demo.com / demo123

## 確認方法

修正後、各デモアカウントでログインできることを確認してください：

1. http://localhost:3000/login にアクセス
2. "デモログイン"ボタンをクリック
3. 各ロール（管理者、整体師、法人担当者）でログインを試す
4. パスワード変更画面にリダイレクトされず、ダッシュボードに直接アクセスできることを確認

## 予防策

今後、デモユーザーを作成する際は必ず`must_change_password = false`を設定してください。
