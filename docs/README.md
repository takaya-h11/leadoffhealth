# Lead off Health - 開発ドキュメント

## 概要
このディレクトリには、Lead off Health予約管理システムの開発に関するドキュメントが含まれています。

## 開発ロードマップ
- **[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md)** - 全体の開発計画と優先順位

## ドキュメント一覧

### Phase 1-2: 基盤・認証機能（✅ 完了）

#### Supabaseセットアップ（001-004）
- ✅ **[001: Supabase Project Setup](./001-supabase-project-setup.md)** - Supabaseプロジェクトセットアップ
- ✅ **[002: Supabase Client Utilities作成](./002-supabase-client-utilities.md)** - Supabaseクライアントユーティリティ
- ✅ **[003: Middleware実装](./003-middleware-implementation.md)** - ミドルウェア実装
- ✅ **[004: Authentication Schema Setup](./004-authentication-schema-setup.md)** - 認証スキーマセットアップ

#### 認証機能（005-009）
- ✅ **[005: ログインページ実装](./005-login-page-implementation.md)** - ログインページ実装
- ✅ **[006: Email確認ハンドラー](./006-email-confirmation-handler.md)** - Email確認ハンドラー
- ✅ **[007: 保護されたダッシュボードページ](./007-protected-dashboard-page.md)** - 保護されたダッシュボードページ
- ✅ **[008: ユーザープロフィール管理](./008-user-profile-management.md)** - ユーザープロフィール管理
- ✅ **[009: パスワードリセット機能](./009-password-reset-flow.md)** - パスワードリセット機能

#### UI/UX（010）
- ✅ **[010: ナビゲーションとレイアウト](./010-navigation-and-layout.md)** - ナビゲーションとレイアウト

---

### Phase 3: ユーザー管理（管理者機能）

- 🔲 **[011: 法人管理](./011-company-management.md)** - 法人管理（CRUD）
- 🔲 **[012: 整体師管理](./012-therapist-management.md)** - 整体師管理（CRUD）
- 🔲 **[013: 法人担当者登録](./013-company-user-registration.md)** - 法人担当者登録
- 🔲 **[014: ユーザー一覧・検索](./014-user-list-search.md)** - ユーザー一覧・検索

### Phase 4: マスターデータ管理（管理者機能）

- 🔲 **[015: 施術メニュー管理](./015-service-menu-management.md)** - 施術メニュー管理
- 🔲 **[016: 症状マスター管理](./016-symptom-master-management.md)** - 症状マスター管理

### Phase 5: スケジュール・空き枠管理（整体師機能）

- 🔲 **[017: 空き枠登録](./017-availability-slot-registration.md)** - 空き枠登録
- 🔲 **[018: 空き枠一覧・削除](./018-availability-slot-list-delete.md)** - 空き枠一覧・削除
- 🔲 **[019: カレンダー表示](./019-calendar-display.md)** - カレンダー表示

### Phase 6: 予約管理

- 🔲 **[020: 予約申込](./020-appointment-request.md)** - 予約申込（法人担当者）
- 🔲 **[021: 予約承認・拒否](./021-appointment-approval.md)** - 予約承認・拒否（整体師）
- 🔲 **[022: 予約一覧・検索](./022-appointment-list-search.md)** - 予約一覧・検索
- 🔲 **[023: 予約キャンセル](./023-appointment-cancellation.md)** - 予約キャンセル
- 🔲 **[024: 予約ステータス管理](./024-appointment-status-management.md)** - 予約ステータス管理

### Phase 7: 施術管理（整体師機能）

- 🔲 **[025: 施術後レポート記入](./025-treatment-report-entry.md)** - 施術後レポート記入
- 🔲 **[026: 施術履歴一覧・詳細](./026-treatment-history-display.md)** - 施術履歴一覧・詳細
- 🔲 **[027: 施術記録検索・フィルター](./027-treatment-search-filter.md)** - 施術記録検索・フィルター

### Phase 8: 通知機能

- 🔲 **[028: メール通知](./028-email-notification.md)** - メール通知（Resend連携）
- 🔲 **[029: アプリ内通知](./029-in-app-notification.md)** - アプリ内通知
- 🔲 **[030: リマインド通知](./030-reminder-notification.md)** - リマインド通知

---

### Phase 9-11: レポート・請求・自動化（今後作成予定）

- 031-040: レポート・請求機能、Cron Jobs

---

## 参考ドキュメント

- **[SUPABASE_URL_CONFIGURATION.md](./SUPABASE_URL_CONFIGURATION.md)** - Supabase URL設定ガイド

## 使い方

### 1. 開発の流れ
1. 実装したい機能のドキュメントを開く
2. 「前提条件」を確認（依存する機能が完了しているか）
3. 「タスク」セクションの手順に従って実装
4. 「完了条件」をすべて満たしたことを確認
5. 次のドキュメントに進む

### 2. ドキュメントの構成
各ドキュメントには以下が含まれます：
- **概要**: 機能の説明
- **前提条件**: 依存する完了済みチケット
- **タスク**: 実装手順とコード例
- **完了条件**: 実装完了のチェックリスト
- **注意事項**: 実装時の重要なポイント
- **依存チケット**: 関連するドキュメント
- **次のステップ**: 次に進むべきドキュメント

### 3. 推奨実装順序

**Phase 1-2（完了済み）:**
1. 001-004: Supabase基盤構築
2. 005-009: 認証機能
3. 010: ナビゲーション

**Phase 3（次のステップ）:**
4. 011: 法人管理 ← **ここから開始**
5. 012: 整体師管理
6. 013: 法人担当者登録
7. 014: ユーザー一覧

**Phase 4-8:**
以降、DEVELOPMENT_ROADMAP.mdの優先順位に従って実装

## 開発状況

### ✅ 完了 (001-010)
基本的な認証機能とナビゲーションが実装済みです。

### 🔲 進行中 (011-)
主要なビジネスロジックの実装を進めています。

**次に実装すべき機能: 011 - 法人管理**

## データベース

データベーススキーマとマイグレーション手順については、以下を参照してください：
- **[../supabase/migrations/README.md](../supabase/migrations/README.md)** - マイグレーション実行ガイド
- **[../supabase/migrations/20250101000000_initial_schema.sql](../supabase/migrations/20250101000000_initial_schema.sql)** - 初期スキーマ定義

## トラブルシューティング

### よくある問題

1. **TypeScriptエラー**
   - `npx tsc --noEmit` でエラーを確認
   - 型定義が正しいか確認

2. **認証エラー**
   - Supabaseの環境変数が正しく設定されているか確認（`.env.local`）
   - RLSポリシーが正しく設定されているか確認

3. **データベースエラー**
   - テーブルが作成されているか確認
   - RLSが有効になっているか確認
   - ポリシーが正しく設定されているか確認

4. **権限エラー**
   - ユーザーのロール（admin/therapist/company_user）が正しいか確認
   - RLSポリシーが該当ロールに対して正しく設定されているか確認

## サポート

質問や問題がある場合は、以下を確認してください：
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [要件定義書](../CLAUDE.md)
- [開発ロードマップ](./DEVELOPMENT_ROADMAP.md)

## ライセンス

このプロジェクトは Lead off Health のプライベートプロジェクトです。
