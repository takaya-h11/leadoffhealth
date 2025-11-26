# データベースマイグレーション適用ガイド

## 概要
人体図描画機能を有効にするために、`treatment_records` テーブルに2つの新しいカラムを追加する必要があります。

## 追加されるカラム

| カラム名 | データ型 | 説明 |
|---------|---------|------|
| `body_diagram_data` | JSONB | 描画データ（線、注釈、ピン、ビュー情報など）を保存 |
| `body_diagram_image_url` | TEXT | Supabase Storageに保存されたPNG画像のURL |

## 適用方法

### 方法1: Supabase ダッシュボード（推奨）

1. **Supabaseダッシュボードにアクセス**
   - ブラウザで https://supabase.com/dashboard を開く
   - プロジェクト `jtdaguehanvqozhhfxru` を選択

2. **SQL Editorを開く**
   - 左サイドバーの「SQL Editor」をクリック
   - 「New query」ボタンをクリック

3. **SQLスクリプトを実行**
   - `scripts/apply-body-diagram-migration.sql` ファイルの内容をすべてコピー
   - SQL Editorにペースト
   - 「Run」ボタンをクリック（または Ctrl+Enter）

4. **実行結果を確認**
   - 成功すると、以下のようなメッセージが表示されます：
     ```
     ✅ Migration completed successfully!
     body_diagram_data and body_diagram_image_url columns have been added
     ```
   - カラム情報のテーブルも表示されます

### 方法2: Supabase CLI（上級者向け）

前提条件:
- Docker Desktop がインストールされて実行中であること
- Supabase アクセストークンが設定されていること

```bash
# プロジェクトをリンク
npx supabase link --project-ref jtdaguehanvqozhhfxru

# マイグレーションを適用
npx supabase db push

# または、特定のマイグレーションを実行
npx supabase migration up
```

### 方法3: Node.jsスクリプト（サービスロールキーが必要）

1. **.env.local にサービスロールキーを追加**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   - サービスロールキーは Supabase Dashboard > Settings > API から取得できます
   - ⚠️ **注意**: サービスロールキーは強力な権限を持つため、絶対にGitにコミットしないでください

2. **スクリプトを実行**
   ```bash
   node scripts/apply-migration.mjs
   ```

## トラブルシューティング

### エラー: "column already exists"
- このエラーは、カラムがすでに存在する場合に表示されます
- `IF NOT EXISTS` 句を使用しているため、問題ありません
- マイグレーションはすでに適用されています

### エラー: "permission denied"
- SQL Editorで実行する際は、管理者権限でログインしていることを確認してください
- サービスロールキーが正しく設定されていることを確認してください

### エラー: "relation does not exist"
- `treatment_records` テーブルが存在しない可能性があります
- 他のマイグレーションが先に実行されているか確認してください

## マイグレーション後の確認

マイグレーションが正しく適用されたか確認するには、以下のSQLを実行します：

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'treatment_records'
  AND column_name IN ('body_diagram_data', 'body_diagram_image_url')
ORDER BY column_name;
```

期待される結果:
```
column_name             | data_type | is_nullable | column_default
-----------------------|-----------|-------------|---------------
body_diagram_data      | jsonb     | YES         | NULL
body_diagram_image_url | text      | YES         | NULL
```

## 次のステップ

マイグレーション適用後:
1. ✅ 開発サーバーを再起動（必要に応じて）
2. ✅ 整体師ダッシュボードにアクセス
3. ✅ 施術後レポート記入ページで人体図機能をテスト
4. ✅ 人体図に描画して保存してみる
5. ✅ データが正しく保存されているか確認

## 参考リンク

- [Supabase マイグレーションガイド](https://supabase.com/docs/guides/cli/managing-environments#migrations)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview#sql-editor)
- [PostgreSQL JSONB型](https://www.postgresql.org/docs/current/datatype-json.html)

## サポート

問題が発生した場合は、以下の情報を含めて報告してください：
- エラーメッセージの全文
- 使用した適用方法（ダッシュボード/CLI/スクリプト）
- Supabaseダッシュボードのログ（Logs & Analytics > Database）
