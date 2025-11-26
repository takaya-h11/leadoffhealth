# 人体図保存問題のデバッグガイド

## 🔍 問題の概要

人体図(Body Diagram)を描画しても、データベースに保存されない問題が報告されています。

## ✅ 確認済み事項

### 1. データベーススキーマ ✅
- `body_diagram_data` カラムは存在しています（JSONB型）
- マイグレーションは正しく適用されています
- インデックスも作成されています

**確認方法:**
```bash
node scripts/check-body-diagram-column.mjs
```

### 2. コードフロー ✅
- フォームからサーバーアクションへのデータ送信ロジックは正しい
- JSONのパース処理も正しい
- Supabaseへの保存処理も正しい

## 🐛 考えられる原因

### 1. **最も可能性が高い: ユーザーが保存ボタンを押していない**

人体図を描画した後、**「保存」ボタンを押さないと** `onSave` が呼ばれず、描画データが親コンポーネントの state に反映されません。

#### 確認手順:
1. 人体図セクションを開く
2. ペンツールで描画する
3. **「保存」ボタンを押す** ⬅ これが重要!
4. フォームを送信する

### 2. RLS (Row Level Security) ポリシーの問題

Supabase の RLS ポリシーが `body_diagram_data` カラムの更新をブロックしている可能性があります。

### 3. クライアント側のエラー

ブラウザの Console に JavaScript エラーが出ている可能性があります。

## 📊 デバッグ用ログの追加

以下のファイルにデバッグ用のログを追加しました:

### フロントエンド
- `src/components/body-diagram/BodyDiagram.tsx`
  - 保存ボタンクリック時のログ
- `src/app/(protected)/therapist/appointments/[id]/report/TreatmentReportForm.tsx`
  - フォーム送信時のログ

### サーバー側
- `src/app/(protected)/therapist/appointments/[id]/report/actions.ts`
  - データ受信時のログ
  - パース処理のログ
  - DB保存時のログ

## 🔧 デバッグ手順

### Step 1: ブラウザコンソールを開く

1. Chrome/Edge: `F12` または `Ctrl+Shift+I`
2. Console タブを開く
3. ログをクリアする

### Step 2: 人体図を描画して保存

1. 施術レポート画面を開く
2. 「人体図を開く」ボタンをクリック
3. ペンツールで何か描く
4. **重要: 「保存」ボタンをクリック**

#### 期待されるログ:
```
💾 BodyDiagram handleSave called
   onSave function exists? true
   data exists? true
   data views: ["front", "back", "left", "right"]
✅ Calling onSave with data
✅ onSave completed
🎨 handleBodyDiagramSave called with data: [Object]
   Has views? Yes
   Metadata: [Object]
✅ Body diagram data saved to state
```

もし「保存」ボタンを押していない場合、これらのログは表示されません。

### Step 3: フォーム送信

施術レポートフォームの「記録する」ボタンをクリック

#### 期待されるログ (クライアント側):
```
📋 Preparing form submission...
   bodyDiagramData state: Has data
✅ Appending body_diagram_data to FormData
   JSON length: 1234
   JSON preview: {"views":{"front":{"strokes":[...]...
```

もし `bodyDiagramData state: null/undefined` と表示された場合、Step 2 の「保存」ボタンを押していない可能性が高いです。

#### 期待されるログ (サーバー側):
```
📊 [CREATE] Body diagram data string received: {"views":{"front":{"strokes":[...]...
✅ [CREATE] Body diagram data parsed successfully: Has data
   Views: ["front","back","left","right"]
💾 [CREATE] Inserting record with body_diagram_data: Present
✅ [CREATE] Record created successfully, ID: xxx
```

### Step 4: データベース確認

```bash
node scripts/check-body-diagram-column.mjs
```

保存後、「Found X records with body diagram data」の数が増えているはずです。

## 🚨 よくあるエラーパターン

### Pattern 1: 保存ボタンを押し忘れ
**症状:**
- 描画はできる
- でもフォーム送信時に `bodyDiagramData state: null/undefined` と表示される

**解決策:**
- 人体図を描いた後、必ず「保存」ボタンを押す

### Pattern 2: RLS ポリシーエラー
**症状:**
- サーバーログに `❌ [CREATE] Treatment record creation error: ...` が表示される
- エラーメッセージに "policy" や "permission" が含まれる

**解決策:**
```sql
-- Supabase Dashboard の SQL Editor で実行
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;

-- INSERT ポリシーを確認/追加
CREATE POLICY "Allow therapists to insert treatment records"
ON treatment_records FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM therapists
    WHERE therapists.user_id = auth.uid()
  )
);

-- UPDATE ポリシーを確認/追加
CREATE POLICY "Allow therapists to update their own records"
ON treatment_records FOR UPDATE
TO authenticated
USING (
  therapist_id IN (
    SELECT id FROM therapists WHERE user_id = auth.uid()
  )
);
```

### Pattern 3: JSON パースエラー
**症状:**
- `❌ [CREATE] Failed to parse body diagram data:` というログが出る

**解決策:**
- コンソールでエラー詳細を確認
- データが壊れている可能性があるため、ページをリロードして再試行

## 🎯 簡易チェックリスト

保存できない場合、以下を確認してください:

- [ ] 人体図セクションを開いた
- [ ] ペンツールで描画した
- [ ] **「保存」ボタンを押した** ⬅ 最重要!
- [ ] ブラウザコンソールにエラーが出ていない
- [ ] フォーム送信時にログが正しく表示される
- [ ] サーバーログでデータ受信が確認できる

## 📝 トラブルシューティング用スクリプト

### データベーススキーマ確認
```bash
node scripts/check-body-diagram-column.mjs
```

### 既存データの確認
Supabase Dashboard → SQL Editor:
```sql
SELECT
  id,
  appointment_id,
  body_diagram_data IS NOT NULL as has_diagram,
  jsonb_pretty(body_diagram_data) as diagram_preview
FROM treatment_records
WHERE body_diagram_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### すべての treatment_records の確認
```sql
SELECT
  id,
  appointment_id,
  created_at,
  body_diagram_data IS NOT NULL as has_diagram
FROM treatment_records
ORDER BY created_at DESC
LIMIT 10;
```

## 🔄 次のステップ

1. **まず上記のデバッグ手順を実行してください**
2. ブラウザコンソールとサーバーログのスクリーンショットを確認
3. どのステップでログが止まっているか確認
4. Pattern 1-3 のどれに該当するか判断

問題が解決しない場合は、以下の情報を提供してください:
- ブラウザコンソールのログ (フルスクリーンショット)
- サーバーログ (npm run dev の出力)
- どのステップまで成功したか
- どのログが表示されていないか
