# 法人専用空き枠機能 - マイグレーション手順

## 概要

この機能により、整体師と管理者が空き枠を作成する際に、特定の法人専用にするか、全法人に公開するかを選択できるようになります。

### 変更内容

1. **データベーススキーマ変更**
   - `available_slots` テーブルに `company_id` カラムを追加
   - `company_id` が NULL の場合: 全法人公開（従来通り）
   - `company_id` に値がある場合: その法人専用

2. **RLSポリシー更新**
   - 法人担当者は公開枠（NULL）と自社専用枠のみ閲覧可能
   - 管理者と整体師は全ての枠を閲覧可能

3. **UI変更**
   - 空き枠作成フォームに法人選択ドロップダウンを追加
   - 空き枠一覧に法人情報バッジを表示

## マイグレーション手順

### 1. マイグレーションの適用

```bash
# Supabaseプロジェクトにログイン
npx supabase login

# ローカル環境でマイグレーション適用（開発環境）
npx supabase db push

# 本番環境にマイグレーション適用
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 2. データの整合性確認

マイグレーション適用後、既存の空き枠は全て `company_id = NULL`（全法人公開）となります。

```sql
-- 確認クエリ: 全ての空き枠が NULL になっていることを確認
SELECT
  id,
  company_id,
  start_time,
  status
FROM available_slots
LIMIT 10;
```

### 3. 動作確認

#### A. 管理者・整体師アカウントでの確認

1. **空き枠作成**
   - `/therapist/slots/new` にアクセス
   - 「対象法人」ドロップダウンが表示されることを確認
   - 法人を選択せずに作成 → 全法人公開枠が作成される
   - 特定の法人を選択して作成 → その法人専用枠が作成される

2. **空き枠一覧**
   - `/therapist/slots` にアクセス
   - 法人専用枠には紫色のバッジ「◯◯株式会社 専用」が表示される
   - 全法人公開枠にはバッジが表示されない

#### B. 法人担当者アカウントでの確認

1. **カレンダー表示**
   - `/company/schedule` にアクセス
   - 以下の枠のみが表示されることを確認:
     - `company_id` が NULL の枠（全法人公開）
     - `company_id` が自社IDの枠（自社専用）

2. **他社専用枠の非表示確認**
   - 別の法人担当者アカウントでログイン
   - 他社専用の枠が表示されないことを確認

### 4. ロールバック手順（問題が発生した場合）

```sql
-- RLSポリシーを元に戻す
DROP POLICY IF EXISTS "法人担当者は公開枠と自社専用枠を閲覧可能" ON public.available_slots;
DROP POLICY IF EXISTS "管理者と整体師は全枠を閲覧可能" ON public.available_slots;

CREATE POLICY "全ユーザーが空き枠を閲覧可能"
  ON public.available_slots FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- company_id カラムを削除
DROP INDEX IF EXISTS idx_available_slots_company_id;
ALTER TABLE public.available_slots DROP COLUMN IF EXISTS company_id;
```

## 使用例

### 全法人公開の空き枠を作成

1. 空き枠作成フォームで「対象法人」を未選択のまま
2. 日時と施術メニューを選択
3. 登録ボタンをクリック
4. → 全ての法人が予約可能

### 特定法人専用の空き枠を作成

1. 空き枠作成フォームで「対象法人」から法人を選択
   - 例: 「株式会社サンプル 専用」
2. 日時と施術メニューを選択
3. 登録ボタンをクリック
4. → その法人のみが予約可能（他社には表示されない）

## セキュリティ

### RLSポリシーによる保護

- データベースレベルでアクセス制御を実施
- フロントエンドのクエリに関係なく、RLSポリシーが自動的にフィルタリング
- 不正なクエリを実行しても、RLSによって他社のデータは取得不可

### テスト方法

```sql
-- 法人担当者として実行（自社ID: xxx-xxx-xxx）
-- RLSにより、自社専用枠と公開枠のみが返される
SELECT * FROM available_slots WHERE status = 'available';

-- 管理者として実行
-- 全ての枠が返される
SELECT * FROM available_slots WHERE status = 'available';
```

## トラブルシューティング

### Q: 法人担当者が自社専用枠を見られない

**A:** 以下を確認してください:
1. ユーザーの `company_id` が正しく設定されているか
2. 空き枠の `company_id` が正しく設定されているか
3. RLSポリシーが正しく適用されているか

```sql
-- ユーザー情報確認
SELECT id, email, role, company_id FROM users WHERE email = 'user@example.com';

-- 空き枠確認
SELECT id, company_id, start_time FROM available_slots WHERE id = 'slot-id';

-- RLSポリシー確認
SELECT * FROM pg_policies WHERE tablename = 'available_slots';
```

### Q: マイグレーションが失敗する

**A:** エラーメッセージを確認し、以下を試してください:
1. 既存のポリシー名と重複していないか確認
2. データベース接続が正しいか確認
3. ロールバックしてから再実行

## 関連ファイル

- **マイグレーション**: `supabase/migrations/20250112000000_add_company_specific_slots.sql`
- **UI変更**:
  - `src/app/(protected)/therapist/slots/new/slot-form.tsx`
  - `src/app/(protected)/therapist/slots/new/page.tsx`
  - `src/app/(protected)/therapist/slots/actions.ts`
  - `src/app/(protected)/therapist/slots/page.tsx`
- **カレンダー**: `src/app/(protected)/company/schedule/page.tsx`

## 完了チェックリスト

- [ ] マイグレーション適用完了
- [ ] 管理者で空き枠作成テスト（全法人公開）
- [ ] 管理者で空き枠作成テスト（特定法人専用）
- [ ] 整体師で空き枠作成テスト
- [ ] 法人担当者A で公開枠が見えることを確認
- [ ] 法人担当者A で自社専用枠が見えることを確認
- [ ] 法人担当者B で法人A専用枠が見えないことを確認
- [ ] 法人担当者一覧で法人情報バッジが表示されることを確認

## 更新履歴

- 2025-01-12: 初版作成
