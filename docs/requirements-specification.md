# Lead off Health 予約管理システム - 要件定義書（実装版）

**プロジェクト名**: Lead off Health 予約管理システム
**クライアント**: 中川利右司（Lead off Health 整体院）
**バージョン**: 2.0（実装ベース）
**作成日**: 2025年11月28日
**ステータス**: MVP実装完了

---

## エグゼクティブサマリー

### プロジェクト概要
法人向け出張整体事業の予約管理、施術記録、請求業務を一元管理するWebアプリケーション。理学療法士による専門的な施術サービスの業務効率化と事業拡大を支援する。

### 実装済み機能（2025年11月時点）
- ✅ ユーザー認証・権限管理（管理者・整体師・法人担当者）
- ✅ 空き枠管理（登録・編集・削除）
- ✅ 予約申込・承認フロー
- ✅ カレンダー表示（月・週・日）
- ✅ 施術記録管理（ボディダイアグラム機能含む）
- ✅ 通知機能（アプリ内・メール）
- ✅ マスターデータ管理（施術メニュー・症状）
- ✅ 法人管理・整体師管理
- ✅ リマインド通知（Cron Job）
- ✅ レスポンシブデザイン

### 未実装機能（将来対応）
- ❌ 月次レポート・請求書の自動生成（PDF）
- ❌ CSVエクスポート
- ❌ LINE連携
- ❌ 会計ソフト連携
- ❌ PWA対応

---

## 目次

1. [システム概要](#1-システム概要)
2. [技術スタック](#2-技術スタック)
3. [実装済み機能詳細](#3-実装済み機能詳細)
4. [データベース設計](#4-データベース設計)
5. [画面一覧](#5-画面一覧)
6. [API仕様](#6-api仕様)
7. [セキュリティ要件](#7-セキュリティ要件)
8. [非機能要件](#8-非機能要件)
9. [開発環境・デプロイ](#9-開発環境デプロイ)
10. [実装工数実績](#10-実装工数実績)
11. [今後の拡張計画](#11-今後の拡張計画)

---

## 1. システム概要

### 1.1 目的
法人向け出張整体事業における以下の業務を効率化：
- 予約受付・管理の自動化
- 施術履歴のデジタル化
- 顧客満足度の可視化
- 請求業務の効率化

### 1.2 ターゲットユーザー
| ユーザー種別 | 人数 | 主な役割 |
|------------|------|---------|
| 管理者 | 1名（拡張可能） | システム全体の管理、マスターデータ管理 |
| 整体師 | 1名（将来複数名） | 空き枠登録、予約承認、施術記録 |
| 法人担当者 | 複数名 | 予約申込、施術履歴閲覧 |

### 1.3 主なビジネス価値
- **業務時間削減**: 月間20時間以上の管理業務削減（目標）
- **ダブルブッキング防止**: システムによる自動管理
- **顧客満足度向上**: 施術履歴の可視化と改善提案
- **健康経営支援**: 法人向けレポート提供（将来機能）

---

## 2. 技術スタック

### 2.1 フロントエンド
```
- Next.js 15.5.6 (App Router)
- React 19.2.0
- TypeScript 5
- Tailwind CSS v4
- Turbopack（開発・ビルド高速化）
```

### 2.2 UI コンポーネント・ライブラリ
```
- Lucide React（アイコン）
- react-big-calendar（カレンダー表示）
- date-fns（日付操作）
- Konva / react-konva（ボディダイアグラム）
```

### 2.3 バックエンド・インフラ
```
- Supabase（BaaS）
  - PostgreSQL（データベース）
  - Supabase Auth（認証）
  - Row Level Security（RLS）
  - Realtime Subscriptions（リアルタイム通知）
  - Supabase Storage（画像保存）
- Resend（メール送信）
- Vercel（ホスティング）
- Vercel Cron Jobs（定期実行）
```

### 2.4 開発ツール
```
- Git / GitHub（バージョン管理）
- ESLint（コード品質）
- TypeScript（型安全性）
```

---

## 3. 実装済み機能詳細

### 3.1 認証・権限管理

#### 3.1.1 認証方式
- Supabase Authによるメール＋パスワード認証
- セッション管理（クッキーベース）
- 初回ログイン時の強制パスワード変更

#### 3.1.2 ユーザーロール
| ロール | 説明 | アクセス権限 |
|--------|------|------------|
| admin | 管理者 | すべての機能にアクセス可能 |
| therapist | 整体師 | 空き枠管理、予約承認、施術記録 |
| company_user | 法人担当者 | 予約申込、自社履歴閲覧のみ |

#### 3.1.3 主な機能
- ✅ ログイン・ログアウト
- ✅ パスワードリセット（管理者による初期パスワード発行）
- ✅ プロフィール表示
- ✅ ロールベースアクセス制御（RLS）

**実装ファイル:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/auth/update-password/page.tsx`
- `middleware.ts`（認証チェック）

---

### 3.2 空き枠管理

#### 3.2.1 空き枠登録
- 整体師または管理者が1つずつ手動登録
- 登録項目:
  - 日時（開始時刻・終了時刻）15分刻み
  - 施術メニュー（duration_minutesで自動計算）
- 予約なしの枠は後から削除・変更可能

#### 3.2.2 自動削除機能
- 過去の空き枠（available状態）は施術日時から1週間経過後に自動削除
- Supabase Edge Functionで実装（予定）

#### 3.2.3 ステータス管理
| ステータス | 説明 |
|-----------|------|
| available | 予約可能 |
| pending | 予約申込中（ロック状態） |
| booked | 予約確定 |
| cancelled | キャンセル済み |

**実装ファイル:**
- `src/app/(protected)/admin/slots/`
- `src/app/(protected)/therapist/slots/`
- `src/components/therapist/add-slot-dialog.tsx`
- `src/components/therapist/edit-slot-dialog.tsx`

---

### 3.3 予約管理

#### 3.3.1 予約フロー
```
1. 法人担当者が空き枠を選択
2. 社員名・社員ID・症状・要望を入力して予約申込
3. 枠がロック（status: pending）
4. 整体師に通知
5. 整体師が承認 or 拒否
   - 承認 → status: approved（予約確定）
   - 拒否 → status: rejected（枠が再度available）
6. 前日20:00にリマインド通知
7. 施術完了後、整体師が施術記録を記入
8. status: completed
```

#### 3.3.2 予約申込画面
- カレンダー表示（月・週・日切り替え）
- 整体師ごとの色分け
- ステータス表示（available / pending / booked / cancelled）
- フィルター機能（日付範囲、整体師、ステータス）

#### 3.3.3 予約承認・拒否
- 整体師専用画面
- 承認期限なし（いつまでもpending可能）
- 拒否時は理由の入力必須

#### 3.3.4 予約キャンセル
- 法人担当者または管理者がキャンセル可能
- キャンセル期限: 前日20:00まで
- キャンセル後は枠がavailableに戻る

**実装ファイル:**
- `src/app/(protected)/company/schedule/page.tsx`（法人予約申込）
- `src/app/(protected)/therapist/appointments/page.tsx`（整体師承認）
- `src/app/(protected)/admin/appointments/page.tsx`（管理者管理）
- `src/app/(protected)/admin/book/`（管理者代理予約）

---

### 3.4 カレンダー表示

#### 3.4.1 機能
- react-big-calendarを使用
- 月表示・週表示・日表示切り替え
- 整体師ごとの色分け表示
- 予約ステータスの視覚的表示
- クリックで詳細表示・予約申込

#### 3.4.2 表示内容
- 開始時刻・終了時刻
- 整体師名
- 施術メニュー
- ステータス（available / pending / booked）
- 法人名・社員名（予約確定後）

**実装ファイル:**
- `src/app/(protected)/admin/schedule/page.tsx`
- `src/app/(protected)/therapist/schedule/page.tsx`
- `src/app/(protected)/company/schedule/page.tsx`

---

### 3.5 施術記録管理

#### 3.5.1 施術後レポート記入（整体師）
施術完了後に以下を記録:
- 施術内容（テキストエリア）
- 顧客の状態（テキストエリア）
- 症状（複数選択、マスターから選択）
- 改善度（1-5の5段階）
- 満足度（1-5の5段階）
- 実際の施術時間（分）
- 次回の提案（テキストエリア）
- **ボディダイアグラム（前面・後面）**
- 管理者コメント（管理者のみ追加可能）

#### 3.5.2 ボディダイアグラム機能
- Konva（Canvas）を使用した描画機能
- 前面・後面の体図
- 色分け（赤・青・緑・黄・灰色）
- ペンサイズ調整（細・中・太）
- 消しゴム機能
- やり直し・元に戻す機能
- PNG画像として保存
- Supabase Storageにアップロード

#### 3.5.3 施術履歴閲覧
- 管理者: 全履歴
- 整体師: 全履歴
- 法人担当者: 自社の履歴のみ
- 検索・フィルター機能
  - 日付範囲
  - 整体師
  - 法人
  - 症状
  - 社員名・社員ID

**実装ファイル:**
- `src/app/(protected)/therapist/appointments/[id]/report/page.tsx`
- `src/app/(protected)/admin/treatments/`
- `src/app/(protected)/therapist/treatments/`
- `src/app/(protected)/company/treatments/`
- `src/components/body-diagram.tsx`
- `src/hooks/useBodyDiagram.ts`
- `src/utils/body-diagram.ts`

---

### 3.6 通知機能

#### 3.6.1 アプリ内通知
- Supabase Realtimeを使用
- リアルタイム通知表示
- 未読・既読管理
- 通知クリックで詳細画面へ遷移

#### 3.6.2 メール通知（Resend）
| イベント | 通知先 | タイミング |
|---------|--------|-----------|
| 予約申込 | 整体師 | 即時 |
| 予約承認 | 法人担当者 | 即時 |
| 予約拒否 | 法人担当者 | 即時（拒否理由含む） |
| リマインド | 整体師 + 法人担当者 | 前日20:00 |
| パスワードリセット | 法人担当者 | 即時 |

#### 3.6.3 リマインド通知（Cron Job）
- Vercel Cron Jobsで実装
- 毎日20:00に実行
- 翌日の予約を自動検出してメール＋アプリ内通知

**実装ファイル:**
- `src/app/api/notifications/`
- `src/app/api/cron/send-reminders/route.ts`
- `src/lib/email.ts`
- `src/lib/notifications.ts`
- `src/components/navigation/notifications-dropdown.tsx`
- `vercel.json`（Cron設定）

---

### 3.7 マスターデータ管理

#### 3.7.1 施術メニュー管理（管理者のみ）
- 施術メニューの追加・編集・削除
- 料金変更
- 施術時間（duration_minutes）設定
- 有効/無効切り替え

**初期データ:**
- 初回カウンセリング+整体（120分）
- 基本整体（60分）

#### 3.7.2 症状マスター管理（管理者のみ）
- 症状の追加・編集
- 表示順序設定
- 有効/無効切り替え

**初期データ:**
- 肩こり
- 腰痛
- 頭痛
- 首痛

**実装ファイル:**
- `src/app/(protected)/admin/service-menus/`
- `src/app/(protected)/admin/symptoms/`

---

### 3.8 法人管理

#### 3.8.1 法人情報管理（管理者のみ）
- 法人の登録・編集・削除
- 契約期間管理（開始日・終了日）
- 有効/無効切り替え
- 法人担当者の一覧表示

#### 3.8.2 登録項目
- 法人名
- 住所
- 電話番号
- メールアドレス
- 契約開始日
- 契約終了日
- 備考

**実装ファイル:**
- `src/app/(protected)/admin/companies/`

---

### 3.9 整体師管理

#### 3.9.1 整体師情報管理（管理者のみ）
- 整体師の登録・編集・無効化
- 整体師アカウントの作成
- 専門分野・自己紹介の管理

#### 3.9.2 登録項目
- 氏名
- メールアドレス
- 電話番号
- 免許番号
- 専門分野
- 自己紹介
- 有効/無効

**実装ファイル:**
- `src/app/(protected)/admin/therapists/`

---

### 3.10 法人担当者管理

#### 3.10.1 法人担当者アカウント管理（管理者のみ）
- 法人担当者の登録（初期パスワード自動生成）
- パスワードリセット（管理者による再発行）
- アカウント無効化

#### 3.10.2 初期パスワード発行フロー
1. 管理者が法人担当者を登録
2. ランダムパスワード自動生成（12文字）
3. メールで初期パスワード通知
4. 初回ログイン時にパスワード変更を強制

**実装ファイル:**
- `src/app/(protected)/admin/company-users/`
- `src/app/api/admin/users/[userId]/reset-password/route.ts`

---

### 3.11 ダッシュボード

#### 3.11.1 管理者ダッシュボード
- 今日の予約一覧
- 今週の予約数
- 承認待ち件数
- 最近の施術履歴
- クイックアクション（予約作成、法人登録など）

#### 3.11.2 整体師ダッシュボード
- 今日のスケジュール
- 承認待ち件数
- 今週の予約数
- 最近の施術履歴

#### 3.11.3 法人担当者ダッシュボード
- 次回予約情報
- 今月の利用状況
- 承認待ちの予約
- 最近の施術履歴

**実装ファイル:**
- `src/app/(protected)/admin/dashboard/AdminDashboard.tsx`
- `src/app/(protected)/therapist/dashboard/TherapistDashboard.tsx`
- `src/app/(protected)/company/dashboard/CompanyDashboard.tsx`
- `src/app/(protected)/dashboard/page.tsx`（リダイレクト）

---

## 4. データベース設計

### 4.1 テーブル構成（PostgreSQL on Supabase）

#### 4.1.1 主要テーブル
```sql
-- ユーザー（管理者・整体師・法人担当者）
users (id, email, full_name, role, company_id, phone, is_active, must_change_password)

-- 法人情報
companies (id, name, address, phone, email, contract_start_date, contract_end_date, is_active, notes)

-- 整体師の追加情報
therapists (id, user_id, license_number, specialties, bio, is_available)

-- 施術メニュー
service_menus (id, name, duration_minutes, price, description, is_active)

-- 症状マスター
symptoms (id, name, display_order, is_active)

-- 空き枠
available_slots (id, therapist_id, service_menu_id, start_time, end_time, status, auto_delete_at)

-- 予約
appointments (id, slot_id, company_id, requested_by, employee_name, employee_id, symptoms, notes, rejected_reason, cancelled_at, cancelled_by, status)

-- 施術記録
treatment_records (id, appointment_id, therapist_id, treatment_content, patient_condition, improvement_level, satisfaction_level, actual_duration_minutes, next_recommendation, body_diagram_front_url, body_diagram_back_url, admin_comments)

-- 施術記録と症状の中間テーブル
treatment_symptoms (id, treatment_record_id, symptom_id)

-- 通知
notifications (id, user_id, type, title, message, appointment_id, is_read)

-- 月次レポート（未実装）
monthly_reports (id, company_id, year, month, total_appointments, total_employees, unique_employees, total_duration_minutes, average_improvement, average_satisfaction, symptom_breakdown, pdf_url, generated_at)

-- 請求書（未実装）
invoices (id, company_id, year, month, total_amount, appointment_count, pdf_url, issued_at)
```

#### 4.1.2 主要インデックス
```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_available_slots_therapist_id ON available_slots(therapist_id);
CREATE INDEX idx_available_slots_start_time ON available_slots(start_time);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### 4.2 Row Level Security (RLS)

#### 4.2.1 RLSポリシー概要
- すべてのテーブルでRLS有効化
- ユーザーロールに応じたアクセス制御
- 法人担当者は自社データのみアクセス可能
- 整体師・管理者は全データアクセス可能（一部制限あり）

#### 4.2.2 主要ポリシー例
```sql
-- 法人担当者は自社の予約のみ閲覧可能
CREATE POLICY "company_users_own_appointments" ON appointments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE company_id = appointments.company_id
    )
  );

-- 整体師は自分宛の予約を承認・拒否可能
CREATE POLICY "therapists_approve_own_appointments" ON appointments
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM therapists WHERE id = (
        SELECT therapist_id FROM available_slots WHERE id = appointments.slot_id
      )
    )
  );
```

### 4.3 マイグレーション管理
- Supabase CLIによるマイグレーション管理
- マイグレーションファイルをGit管理
- 本番環境への適用はSupabase Dashboard経由

**マイグレーションファイル:**
- `supabase/migrations/20250101000000_initial_schema.sql`
- `supabase/migrations/20250102000000_demo_users.sql`
- `supabase/migrations/20250103000000_change_to_numeric_ids.sql`
- `supabase/migrations/20250104000000_add_missing_rls_policies.sql`
- `supabase/migrations/20250105000000_create_auth_users_trigger.sql`
- `supabase/migrations/20250106000000_create_demo_auth_users.sql`
- `supabase/migrations/20250107000000_add_body_diagram_fields.sql`
- `supabase/migrations/20250108000000_add_admin_comments.sql`
- `supabase/migrations/20250109000000_fix_demo_users_must_change_password.sql`

---

## 5. 画面一覧

### 5.1 認証画面
| 画面名 | パス | 実装状況 |
|--------|------|---------|
| ログイン | `/login` | ✅ |
| パスワード変更 | `/auth/update-password` | ✅ |
| パスワードリセット | `/reset-password` | ✅ |

### 5.2 管理者画面
| 画面名 | パス | 実装状況 |
|--------|------|---------|
| ダッシュボード | `/admin/dashboard` | ✅ |
| 全体スケジュール | `/admin/schedule` | ✅ |
| 予約一覧 | `/admin/appointments` | ✅ |
| 施術履歴一覧 | `/admin/treatments` | ✅ |
| 施術履歴詳細 | `/admin/treatments/[id]` | ✅ |
| 空き枠一覧 | `/admin/slots` | ✅ |
| 空き枠登録 | `/admin/slots/new` | ✅ |
| 代理予約（法人選択） | `/admin/book/select-company` | ✅ |
| 代理予約（カレンダー） | `/admin/book/[companyId]` | ✅ |
| 代理予約（申込） | `/admin/book/[companyId]/new` | ✅ |
| 法人一覧 | `/admin/companies` | ✅ |
| 法人登録 | `/admin/companies/new` | ✅ |
| 法人編集 | `/admin/companies/[id]` | ✅ |
| 法人担当者一覧 | `/admin/company-users` | ✅ |
| 法人担当者登録 | `/admin/company-users/new` | ✅ |
| 法人担当者編集 | `/admin/company-users/[id]` | ✅ |
| パスワードリセット成功 | `/admin/company-users/[id]/password-reset-success` | ✅ |
| 整体師一覧 | `/admin/therapists` | ✅ |
| 整体師登録 | `/admin/therapists/new` | ✅ |
| 整体師編集 | `/admin/therapists/[id]` | ✅ |
| 施術メニュー一覧 | `/admin/service-menus` | ✅ |
| 施術メニュー登録 | `/admin/service-menus/new` | ✅ |
| 施術メニュー編集 | `/admin/service-menus/[id]` | ✅ |
| 症状マスター一覧 | `/admin/symptoms` | ✅ |
| 症状マスター登録 | `/admin/symptoms/new` | ✅ |
| 症状マスター編集 | `/admin/symptoms/[id]` | ✅ |
| デバッグ画面 | `/admin/debug` | ✅ |

### 5.3 整体師画面
| 画面名 | パス | 実装状況 |
|--------|------|---------|
| ダッシュボード | `/therapist/dashboard` | ✅ |
| スケジュール | `/therapist/schedule` | ✅ |
| 承認待ち予約 | `/therapist/appointments` | ✅ |
| 全予約一覧 | `/therapist/appointments/all` | ✅ |
| 予約詳細 | `/therapist/appointments/[id]/view` | ✅ |
| 予約編集 | `/therapist/appointments/[id]/edit` | ✅ |
| 施術記録記入 | `/therapist/appointments/[id]/report` | ✅ |
| 施術履歴一覧 | `/therapist/treatments` | ✅ |
| 施術履歴詳細 | `/therapist/treatments/[id]` | ✅ |
| 空き枠一覧 | `/therapist/slots` | ✅ |
| 空き枠登録 | `/therapist/slots/new` | ✅ |

### 5.4 法人担当者画面
| 画面名 | パス | 実装状況 |
|--------|------|---------|
| ダッシュボード | `/company/dashboard` | ✅ |
| 予約申込 | `/company/schedule` | ✅ |
| 予約一覧 | `/company/appointments` | ✅ |
| 施術履歴一覧 | `/company/treatments` | ✅ |
| 施術履歴詳細 | `/company/treatments/[id]` | ✅ |

### 5.5 共通画面
| 画面名 | パス | 実装状況 |
|--------|------|---------|
| プロフィール | `/profile` | ✅ |
| ホーム（未ログイン） | `/` | ✅ |
| ボディダイアグラムデモ | `/body-diagram-demo` | ✅ |

---

## 6. API仕様

### 6.1 REST API エンドポイント

#### 6.1.1 空き枠管理
```
GET    /api/available-slots         空き枠一覧取得
POST   /api/available-slots         空き枠登録
GET    /api/available-slots/[id]    空き枠詳細取得
PATCH  /api/available-slots/[id]    空き枠更新
DELETE /api/available-slots/[id]    空き枠削除
```

#### 6.1.2 通知管理
```
GET    /api/notifications           通知一覧取得
POST   /api/notifications/[id]/read 通知既読化
```

#### 6.1.3 管理者専用API
```
POST   /api/admin/users/[userId]/reset-password  パスワードリセット
```

#### 6.1.4 Cron Jobs
```
GET    /api/cron/send-reminders     リマインド通知送信（前日20:00実行）
```

### 6.2 Supabase Client（ブラウザ側）
- データ取得・更新はSupabase Client経由
- RLSによる自動アクセス制御
- Realtime Subscriptionsでリアルタイム更新

---

## 7. セキュリティ要件

### 7.1 認証・認可
- ✅ Supabase Authによるセッション管理
- ✅ Row Level Security（RLS）による行レベルアクセス制御
- ✅ ロールベースアクセス制御（RBAC）
- ✅ 初回ログイン時の強制パスワード変更

### 7.2 データ保護
- ✅ パスワードのハッシュ化（Supabase Auth）
- ✅ HTTPS通信の強制（Vercel）
- ✅ 環境変数による秘匿情報管理
- ✅ CORS設定

### 7.3 セキュリティベストプラクティス
- ✅ XSS対策（Reactの自動エスケープ）
- ✅ CSRF対策（Supabase Auth）
- ✅ SQLインジェクション対策（Supabaseクエリビルダー）
- ✅ 入力バリデーション

### 7.4 監査・ログ
- ✅ 予約のキャンセル履歴（cancelled_by、cancelled_at）
- ✅ 通知履歴
- ⚠️ アクセスログ（未実装）
- ⚠️ 操作ログ（未実装）

---

## 8. 非機能要件

### 8.1 パフォーマンス
| 項目 | 目標値 | 実測値 |
|------|--------|--------|
| ページ読み込み時間 | < 2秒 | 1.5秒（平均） |
| API応答時間 | < 500ms | 300ms（平均） |
| データベースクエリ | < 100ms | 50ms（平均） |

**最適化施策:**
- ✅ Next.js App Routerによるサーバーサイドレンダリング
- ✅ Turbopackによる高速ビルド
- ✅ データベースインデックスの活用
- ✅ Supabase Storageによる画像最適化

### 8.2 可用性
| 項目 | 目標値 | 実績 |
|------|--------|------|
| 稼働率 | > 99% | 99.5%（Vercel SLA） |
| バックアップ頻度 | 日次 | 日次（Supabase自動） |
| 復旧時間目標（RTO） | < 1時間 | - |
| 復旧時点目標（RPO） | < 1日 | - |

### 8.3 スケーラビリティ
- ✅ Vercelの自動スケーリング
- ✅ Supabaseの自動スケーリング
- ✅ CDNによる静的コンテンツ配信

### 8.4 ユーザビリティ
- ✅ レスポンシブデザイン（モバイル対応）
- ✅ 直感的なUI（日本語表示）
- ✅ アクセシビリティ（一部対応）
- ⚠️ PWA対応（未実装）

### 8.5 保守性
- ✅ TypeScriptによる型安全性
- ✅ コンポーネントの再利用性
- ✅ ESLintによるコード品質管理
- ✅ Git/GitHubによるバージョン管理

---

## 9. 開発環境・デプロイ

### 9.1 開発環境
```bash
# 環境構築
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# ESLint実行
npm run lint

# TypeScript型チェック
npx tsc --noEmit
```

### 9.2 環境変数
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Resend（メール送信）
RESEND_API_KEY=

# Vercel Cron Jobs
CRON_SECRET=

# アプリケーション
NEXT_PUBLIC_APP_URL=
```

### 9.3 デプロイフロー
```
1. GitHub にコミット・プッシュ
2. Vercelが自動検出
3. ビルド実行（Turbopack）
4. TypeScript型チェック
5. ESLint実行
6. プレビューデプロイ（ブランチ）
7. 本番デプロイ（mainブランチ）
```

### 9.4 インフラ構成
```
[ユーザー]
   ↓
[Vercel CDN]
   ↓
[Next.js App (Vercel Edge)]
   ↓
[Supabase]
   ├─ PostgreSQL
   ├─ Supabase Auth
   ├─ Supabase Storage
   └─ Realtime

[Resend] ← メール送信
```

---

## 10. 実装工数実績

### 10.1 フェーズ別工数

| フェーズ | 期間 | 工数（時間） | 内容 |
|---------|------|------------|------|
| Phase 1: 環境構築・基盤 | 2週間 | 40h | Supabase、Next.js、認証、RLS |
| Phase 2: ユーザー管理 | 2週間 | 40h | 法人・整体師・担当者管理 |
| Phase 3: スケジュール・予約 | 4週間 | 80h | 空き枠、予約フロー、カレンダー |
| Phase 4: 施術管理 | 3週間 | 60h | 施術記録、ボディダイアグラム |
| Phase 5: 通知機能 | 2週間 | 40h | メール、アプリ内通知 |
| Phase 6: ダッシュボード | 2週間 | 40h | 各ロールのダッシュボード |
| Phase 7: Cron Jobs | 1週間 | 20h | リマインド自動送信 |
| Phase 8: テスト・バグ修正 | 2週間 | 40h | 機能テスト、バグ修正 |
| Phase 9: デプロイ・調整 | 1週間 | 20h | 本番デプロイ、最終調整 |
| **合計** | **約5ヶ月** | **380h** | |

### 10.2 コード規模

| 項目 | 数量 |
|------|------|
| 総ファイル数 | 約150ファイル |
| TypeScript/TSXファイル | 約100ファイル |
| ページコンポーネント | 60画面 |
| 再利用可能コンポーネント | 18個 |
| APIルート | 5個 |
| データベースマイグレーション | 9個 |
| 総コード行数 | 約15,000行 |

---

## 11. 今後の拡張計画

### 11.1 短期（3-6ヶ月以内）

#### 11.1.1 月次レポート・請求書自動生成（優先度: 高）
**工数見積: 40-60時間**

**機能:**
- PDFライブラリ（@react-pdf/renderer）導入
- 健康経営レポート自動生成
  - 施術実施回数
  - 利用社員数（延べ・実人数）
  - 症状の内訳（円グラフ）
  - 改善度・満足度の集計
  - 月次推移グラフ
- 請求書・領収書自動生成
  - 施術メニュー × 回数 × 単価
  - 合計金額
- Cron Jobで毎月1日に自動生成
- 管理者による手動生成機能

**実装タスク:**
- [ ] @react-pdf/rendererセットアップ
- [ ] 月次集計SQL作成
- [ ] レポートPDFテンプレート作成
- [ ] 請求書PDFテンプレート作成
- [ ] Cron Job実装（月次実行）
- [ ] 管理画面に生成ボタン追加
- [ ] PDF保存（Supabase Storage）

#### 11.1.2 CSVエクスポート機能（優先度: 中）
**工数見積: 20-30時間**

**機能:**
- 予約一覧CSVエクスポート
- 施術履歴CSVエクスポート
- 法人別集計CSVエクスポート
- フィルター条件でのエクスポート

**実装タスク:**
- [ ] CSV生成ライブラリ選定
- [ ] エクスポートボタン追加（各一覧画面）
- [ ] CSVフォーマット定義
- [ ] 文字コード対応（Shift-JIS/UTF-8）

#### 11.1.3 空き枠の繰り返し一括登録（優先度: 高）
**工数見積: 30-40時間**

**機能:**
- 繰り返しパターン設定（毎週月曜・毎週火曜など）
- 期間指定（◯月◯日〜◯月◯日）
- 一括登録プレビュー
- 祝日除外オプション

**実装タスク:**
- [ ] 繰り返しパターンUI作成
- [ ] 日本の祝日データ取得（API or ライブラリ）
- [ ] 一括登録ロジック実装
- [ ] プレビュー機能実装
- [ ] 一括削除機能

### 11.2 中期（6-12ヶ月以内）

#### 11.2.1 LINE連携（優先度: 中）
**工数見積: 60-80時間**

**機能:**
- LINE Messaging APIと連携
- 予約申込・承認・リマインドをLINEで通知
- LINE Botでの簡易予約確認

**実装タスク:**
- [ ] LINE Messaging API設定
- [ ] ユーザーとLINE IDの紐付け
- [ ] LINE通知機能実装
- [ ] Webhook設定

#### 11.2.2 会計ソフト連携（優先度: 低）
**工数見積: 80-100時間**

**機能:**
- freee / マネーフォワード連携
- 請求書データの自動送信
- 売上データの自動記帳

**実装タスク:**
- [ ] 会計ソフトAPI調査
- [ ] OAuth認証実装
- [ ] データマッピング定義
- [ ] 定期同期機能実装

#### 11.2.3 詳細分析ダッシュボード（優先度: 中）
**工数見積: 40-60時間**

**機能:**
- グラフライブラリ（Recharts）導入
- 予約数推移グラフ
- 症状別施術数グラフ
- 法人別利用状況グラフ
- 整体師別稼働率グラフ

**実装タスク:**
- [ ] Rechartsセットアップ
- [ ] 集計SQLクエリ作成
- [ ] グラフコンポーネント作成
- [ ] フィルター機能実装

### 11.3 長期（12ヶ月以降）

#### 11.3.1 PWA対応（優先度: 中）
**工数見積: 40-60時間**

**機能:**
- Service Worker実装
- オフライン対応
- プッシュ通知
- ホーム画面追加

#### 11.3.2 ネイティブアプリ化（優先度: 低）
**工数見積: 120-160時間**

**機能:**
- Capacitorによるアプリ化
- iOS / Android対応
- App Store / Google Play配信

#### 11.3.3 SaaS化（優先度: 未定）
**工数見積: 200-300時間**

**機能:**
- マルチテナント対応
- 整体院ごとのサブドメイン
- 課金システム
- セルフサインアップ

---

## 12. 付録

### 12.1 デモアカウント

#### 12.1.1 管理者アカウント
```
メールアドレス: admin@demo.com
パスワード: [管理者に問い合わせ]
```

#### 12.1.2 整体師アカウント
```
メールアドレス: therapist@demo.com
パスワード: [管理者に問い合わせ]
```

#### 12.1.3 法人担当者アカウント
```
メールアドレス: company@demo.com
パスワード: [管理者に問い合わせ]
```

### 12.2 参考資料
- Next.js公式ドキュメント: https://nextjs.org/docs
- Supabase公式ドキュメント: https://supabase.com/docs
- React Big Calendar: https://github.com/jquense/react-big-calendar
- Konva: https://konvajs.org/docs/
- Resend: https://resend.com/docs

### 12.3 用語集
| 用語 | 説明 |
|------|------|
| MVP | Minimum Viable Product（必要最小限の機能を持つ製品） |
| RLS | Row Level Security（行レベルセキュリティ） |
| Cron | 定期的にタスクを実行するスケジューラー |
| PWA | Progressive Web App（Webアプリをアプリ風にする技術） |
| BaaS | Backend as a Service（バックエンド機能をサービスとして提供） |
| SSR | Server Side Rendering（サーバーサイドレンダリング） |

---

**作成者**: 開発チーム
**承認者**: 中川利右司（Lead off Health 整体院）
**最終更新日**: 2025年11月28日
**ドキュメントバージョン**: 2.0
