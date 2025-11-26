# デモユーザーセットアップガイド

このガイドでは、開発用のデモユーザーを作成する手順を説明します。

## 前提条件
- Supabaseプロジェクトが作成されていること
- 初期スキーマ（20250101000000_initial_schema.sql）が実行済みであること

## セットアップ手順

### 1. Supabaseダッシュボードで認証ユーザーを作成

Supabaseダッシュボード（https://supabase.com/dashboard）にアクセスし、以下の手順でデモユーザーを作成します：

#### 1-1. Authentication > Users に移動

#### 1-2. "Add user" > "Create new user" をクリック

#### 1-3. 以下の3つのユーザーを作成

**管理者ユーザー:**
- Email: `admin@demo.com`
- Password: `demo123`
- Auto Confirm User: ✅ チェックを入れる（メール確認をスキップ）

**整体師ユーザー:**
- Email: `therapist@demo.com`
- Password: `demo123`
- Auto Confirm User: ✅ チェックを入れる

**法人担当者ユーザー:**
- Email: `company@demo.com`
- Password: `demo123`
- Auto Confirm User: ✅ チェックを入れる

### 2. ユーザーIDを取得

作成した各ユーザーのIDをコピーします：
1. Authentication > Users で各ユーザーをクリック
2. User UID をコピー

### 3. マイグレーションスクリプトを編集

`supabase/migrations/20250102000000_demo_users.sql` を開き、以下の箇所を実際のUser UIDに置き換えます：

```sql
INSERT INTO public.users (id, email, full_name, role, company_id, phone, is_active, must_change_password)
VALUES
  ('ここに管理者のUser UIDを貼り付け', 'admin@demo.com', '管理者 太郎', 'admin', NULL, '090-1111-1111', true, false),
  ('ここに整体師のUser UIDを貼り付け', 'therapist@demo.com', '整体師 花子', 'therapist', NULL, '090-2222-2222', true, false),
  ('ここに法人担当者のUser UIDを貼り付け', 'company@demo.com', '法人担当 次郎', 'company_user', '11111111-1111-1111-1111-111111111111', '090-3333-3333', true, false)
...
```

### 4. SQLエディタでスクリプトを実行

1. Supabaseダッシュボードの SQL Editor に移動
2. `supabase/migrations/20250102000000_demo_users.sql` の内容をコピー
3. 貼り付けて実行（Run）

### 5. 動作確認

アプリケーション（http://localhost:3002/login）にアクセスし、開発者用ログインボタンで各ロールのユーザーでログインできることを確認します。

## デモユーザー情報

| ロール | メールアドレス | パスワード | 氏名 | 備考 |
|--------|---------------|-----------|------|------|
| 管理者 | admin@demo.com | demo123 | 管理者 太郎 | 全機能にアクセス可能 |
| 整体師 | therapist@demo.com | demo123 | 整体師 花子 | 空き枠管理・予約承認・施術記録 |
| 法人担当者 | company@demo.com | demo123 | 法人担当 次郎 | 予約申込・自社データ閲覧 |

## トラブルシューティング

### ログインできない場合
1. Supabase > Authentication > Users で該当ユーザーが "confirmed" 状態になっているか確認
2. public.users テーブルにデータが正しく挿入されているか確認
3. ブラウザのコンソールでエラーメッセージを確認

### 権限エラーが出る場合
- RLSポリシーが正しく設定されているか確認
- ユーザーのroleカラムが正しく設定されているか確認

## 本番環境での注意

**重要:** これらのデモユーザーは開発環境専用です。本番環境では以下を実施してください：
- デモユーザーを削除または無効化
- 強力なパスワードを使用
- メール確認を有効化
