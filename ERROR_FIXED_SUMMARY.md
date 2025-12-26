# エラー修正サマリー

**最終更新**: 2025年12月9日

---

## 🐛 発生したエラー

### エラー1: ビューエラー
```
ERROR: 42P16: cannot drop columns from view
```

**原因**: 既存のビューが存在していた
**修正**: `DROP VIEW IF EXISTS ... CASCADE` を追加

---

### エラー2: データ型不一致エラー
```
ERROR: 42804: foreign key constraint "available_slots_company_id_fkey" cannot be implemented
DETAIL: Key columns "company_id" and "id" are of incompatible types: uuid and bigint.
```

**原因**: `companies.id` が `BIGINT` なのに、`company_id` を `UUID` で作成しようとした
**修正**: `company_id` を `BIGINT` に変更

---

## ✅ 修正した内容

### 修正したファイル

1. **`scripts/MIGRATION_2_COMPLETE.sql`**
   ```sql
   -- 修正前
   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES ...

   -- 修正後
   ADD COLUMN IF NOT EXISTS company_id BIGINT REFERENCES ...
   ```

2. **`supabase/migrations/20250112000000_add_company_specific_slots.sql`**
   - 同じく `UUID` → `BIGINT` に修正

3. **`scripts/MIGRATION_1_COMPLETE.sql`**
   - `DROP VIEW IF EXISTS ... CASCADE` を追加

---

## 🚀 次のステップ

修正版のマイグレーションを実行してください：

1. **Supabase SQL Editorを開く**
   ```
   https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru/sql
   ```

2. **マイグレーション1を実行**
   ```
   scripts/MIGRATION_1_COMPLETE.sql
   ```

3. **マイグレーション2を実行**
   ```
   scripts/MIGRATION_2_COMPLETE.sql
   ```
   ※ `BIGINT` 版に修正済み

4. **確認**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'available_slots' AND column_name = 'company_id';
   ```
   期待される結果: `data_type = 'bigint'`

---

## 📋 データベース設計の確認

### ID型の整理

| テーブル | id カラムの型 | 理由 |
|---------|--------------|------|
| `users` | UUID | auth.users との連携 |
| `companies` | BIGINT | 数値ID（auto increment） |
| `therapists` | BIGINT | 数値ID |
| `service_menus` | BIGINT | 数値ID |
| `symptoms` | BIGINT | 数値ID |
| `available_slots` | BIGINT | 数値ID |
| `appointments` | BIGINT | 数値ID |

### 外部キーの型

| テーブル | カラム | 参照先 | 型 |
|---------|--------|--------|-----|
| `users` | `company_id` | `companies.id` | BIGINT |
| `appointments` | `company_id` | `companies.id` | BIGINT |
| `appointments` | `user_id` | `users.id` | UUID |
| `available_slots` | `company_id` | `companies.id` | BIGINT ✅ |

---

## ✅ 完了チェックリスト

- [x] ビューエラーを修正
- [x] データ型エラーを修正
- [x] マイグレーションファイルを更新
- [ ] マイグレーション1を実行
- [ ] マイグレーション2を実行
- [ ] データ型を確認（bigint であることを確認）
- [ ] 既存データ移行

---

## 📞 サポート

さらにエラーが発生した場合:
1. エラーメッセージ全体をコピー
2. `scripts/check-table-types.sql` を実行してデータ型を確認
3. GitHub Issueで報告

---

**次**: `RUN_THIS_NOW.md` を参照してマイグレーションを実行してください！
