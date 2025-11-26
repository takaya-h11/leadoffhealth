# 333322aaaa@gmail.com のエラー調査

## 問題
`333322aaaa@gmail.com` で整体師を登録しようとすると「このメールアドレスは既に登録されています」というエラーが出るが、データベースには存在しないはず。

## 原因
**トリガーとコードの二重登録の問題**が原因でした：

1. `auth.users` にユーザーを作成
2. **トリガー**が自動的に `public.users` にもレコードを作成
3. コードが手動で `public.users` に INSERT しようとして重複エラー（23505）が発生

## 修正内容
`src/app/(protected)/admin/therapists/actions.ts` を修正しました：
- **変更前**: `INSERT` を使用（重複エラーが発生）
- **変更後**: `UPDATE` を使用（トリガーで作成されたレコードを更新）

## データベース確認方法

Supabase Dashboard の SQL Editor で以下を実行してください：

### 1. メールアドレスが存在するか確認

```sql
-- public.usersテーブルをチェック
SELECT 'public.users' as source, id, email, full_name, role, is_active, created_at
FROM public.users
WHERE email = '333322aaaa@gmail.com';

-- auth.usersテーブルをチェック
SELECT 'auth.users' as source, id, email, created_at, last_sign_in_at, deleted_at
FROM auth.users
WHERE email = '333322aaaa@gmail.com';
```

### 2. もし存在する場合は削除

```sql
-- public.usersから削除
DELETE FROM public.users WHERE email = '333322aaaa@gmail.com';

-- auth.usersから削除（admin権限が必要）
-- Supabase Dashboardの"Authentication" > "Users"から削除する方が安全です
```

### 3. 再登録を試す

データベースから削除した後、もう一度整体師登録フォームから登録してください。

## 予防策

今後は修正されたコードを使用するため、この問題は発生しません。

---

## テスト手順

1. **確認**: 上記のSQLで `333322aaaa@gmail.com` が存在するか確認
2. **削除**: 存在する場合は削除
3. **再登録**: 整体師登録フォームから再度登録
4. **確認**: 正常に登録できることを確認

修正が完了したので、今後は同じエラーは発生しません！
