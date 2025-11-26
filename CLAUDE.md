# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.6 application for LeadOffHealth, using the App Router with TypeScript, React 19, and Tailwind CSS v4. The project was bootstrapped with `create-next-app` and uses Turbopack for faster builds.

## Commands

### Development
```bash
npm run dev        # Start development server with Turbopack (http://localhost:3000)
npm run build      # Build for production with Turbopack
npm start          # Start production server
npm run lint       # Run ESLint
```

## Architecture

### Project Structure
- `src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind CSS v4 imports and CSS variables

### TypeScript Configuration
- Path alias `@/*` maps to `./src/*` for cleaner imports
- Strict mode enabled
- Target: ES2017

### Styling
- Tailwind CSS v4 via PostCSS plugin (`@tailwindcss/postcss`)
- CSS variables defined in `globals.css` for theming (`--background`, `--foreground`)
- Font variables: `--font-geist-sans` and `--font-geist-mono`
- Dark mode support via `prefers-color-scheme`

### ESLint
- Uses flat config format (eslint.config.mjs)
- Extends `next/core-web-vitals` and `next/typescript`
- Ignores: node_modules, .next, out, build, next-env.d.ts

## Key Technologies
- Next.js 15.5.6 with App Router
- React 19.1.0
- TypeScript 5
- Tailwind CSS v4
- Turbopack (enabled for dev and build)
- Geist font family (via next/font/google)

# 法人向け出張整体 予約管理システム - 要件定義書

**プロジェクト名**: Lead off Health 予約管理システム  
**クライアント**: 中川利右司（Lead off Health 整体院）  
**バージョン**: 1.0  
**作成日**: 2025年10月21日  
**フェーズ**: MVP（Minimum Viable Product）

---

## 目次

1. [システム概要](#1-システム概要)
2. [ビジネス背景](#2-ビジネス背景)
3. [ユーザー種別と権限](#3-ユーザー種別と権限)
4. [主要機能](#4-主要機能)
5. [予約フロー](#5-予約フロー)
6. [データベース設計](#6-データベース設計)
7. [技術スタック](#7-技術スタック)
8. [画面一覧](#8-画面一覧)
9. [通知仕様](#9-通知仕様)
10. [レポート・請求機能](#10-レポート請求機能)
11. [制約事項・ビジネスルール](#11-制約事項ビジネスルール)
12. [セキュリティ要件](#12-セキュリティ要件)
13. [非機能要件](#13-非機能要件)
14. [将来機能（MVP範囲外）](#14-将来機能mvp範囲外)
15. [開発スケジュール](#15-開発スケジュール)

---

## 1. システム概要

### 1.1 目的
法人向け出張整体事業の予約管理、施術記録、請求業務を一元管理し、業務効率化と事業拡大を支援する。

### 1.2 主なユーザー
- **管理者**: 中川利右司氏（将来的に複数の管理者）
- **整体師**: 派遣される施術者（将来的に複数名）
- **法人担当者**: 契約企業の予約担当者

### 1.3 主な機能
- 整体師の空き枠管理
- 法人からの予約申込・承認フロー
- 施術記録の管理
- 月次請求書・領収書の自動生成
- 健康経営レポートの自動生成

---

## 2. ビジネス背景

### 2.1 現状の課題
- LINE・電話での手動予約管理
- ダブルブッキングのリスク
- 施術履歴の管理が煩雑
- 請求書作成の手間
- 健康経営レポートの手作業

### 2.2 サービスの特徴
- 理学療法士（国家資格）による専門施術
- ビジネスパーソン・経営者層がメイン顧客
- 東京都心部（霞が関・丸の内・虎ノ門周辺）を中心に展開
- リピート率9割以上の高満足度サービス

### 2.3 ターゲット法人
- 健康経営に取り組む企業
- 福利厚生を重視する企業
- 社員の生産性向上を目指す企業

---

## 3. ユーザー種別と権限

### 3.1 管理者（Admin）

**できること:**
- ✅ 全機能へのアクセス
- ✅ 法人の登録・編集・削除
- ✅ 整体師の登録・編集・無効化
- ✅ 法人担当者の登録（初期パスワード発行）
- ✅ 施術メニューの管理（追加・編集・削除・料金変更）
- ✅ 症状マスターの管理（追加・編集）
- ✅ 全予約の閲覧・編集・キャンセル
- ✅ 整体師の代わりに空き枠登録・予約承認
- ✅ 法人の代わりに予約申込
- ✅ 全施術履歴の閲覧
- ✅ 月次レポート・請求書の生成
- ✅ 管理者権限の追加（複数の管理者アカウント作成可能）

### 3.2 整体師（Therapist）

**できること:**
- ✅ 自分の空き枠の登録・削除・変更（予約なしの場合）
- ✅ 全体スケジュール（全整体師の予約状況）の閲覧
- ✅ 自分宛の予約の承認・拒否
- ✅ 全員の施術履歴の閲覧
- ✅ 自分の施術後レポートの記入
- ✅ 法人情報の閲覧

**できないこと:**
- ❌ 他の整体師の空き枠の編集
- ❌ 法人の登録・編集
- ❌ マスターデータの編集
- ❌ レポート・請求書の生成

### 3.3 法人担当者（Company User）

**できること:**
- ✅ 空いている枠への予約申込
- ✅ 自社の全予約の閲覧
- ✅ 自社の予約のキャンセル（前日20時まで）
- ✅ 自社の施術履歴の閲覧
- ✅ 自社の今月の利用状況確認

**できないこと:**
- ❌ 他社の予約・履歴の閲覧
- ❌ 整体師の情報編集
- ❌ 予約の承認・拒否
- ❌ 前日20時以降のキャンセル

---

## 4. 主要機能

### 4.1 スケジュール・空き枠管理

#### 4.1.1 空き枠の登録
- 整体師が手動で1つずつ登録
- 登録項目:
  - 日時（開始時刻・終了時刻）
  - 施術メニュー（初回カウンセリング+整体 or 基本整体）
- 予約が入っていない枠は後から削除・変更可能
- 過去の空き枠（available状態）は施術日時から1週間経過後に自動削除

#### 4.1.2 カレンダー表示
- 月表示・週表示・日表示
- 整体師ごとの色分け
- 予約状況のステータス表示（available / pending / booked / cancelled）

### 4.2 予約管理

#### 4.2.1 予約申込（法人担当者）
- 空いている枠を選択
- 入力項目:
  - 社員名（必須）
  - 社員ID（社員番号・必須）※同姓同名対策
  - 症状（複数選択可、マスターから選択）
  - 要望・特記事項（自由記述）
- 申込時点で枠がロック（status: pending）

#### 4.2.2 予約承認・拒否（整体師）
- 整体師に通知が届く
- 承認・拒否を選択
- 拒否時は拒否理由を自由記述で入力
- **承認期限なし**（いつまでもpending可能）

#### 4.2.3 予約確定
- 承認された時点で確定（status: approved）
- 法人担当者に通知

#### 4.2.4 キャンセル
- 法人担当者または管理者がキャンセル可能
- キャンセル期限: 前日20時まで
- キャンセル後、枠は再度available状態に戻る

#### 4.2.5 日時変更
- 不可（一度キャンセルして再予約）

### 4.3 施術管理

#### 4.3.1 施術後レポート記入（整体師）
施術完了後、以下を記録:
- 施術内容（テキストエリア）
- 顧客の状態（テキストエリア）
- 症状（複数選択、マスターから選択）
- 改善度（1-5の5段階）
- 満足度（1-5の5段階）※整体師がヒアリングして入力
- 実際の施術時間（分）
- 次回の提案（テキストエリア）

#### 4.3.2 施術履歴の閲覧
- 管理者: 全履歴
- 整体師: 全履歴
- 法人担当者: 自社の履歴のみ

### 4.4 マスターデータ管理

#### 4.4.1 施術メニュー（管理者のみ編集可）
初期データ:
- 初回カウンセリング+整体（120分）
- 基本整体（60分）

管理者が追加・編集・削除・料金変更可能

#### 4.4.2 症状マスター（管理者のみ編集可）
初期データ:
- 肩こり
- 腰痛
- 頭痛
- 首痛

管理者が追加・編集可能

### 4.5 検索・フィルター機能

以下の条件で絞り込み可能:
- 日付範囲（◯月◯日〜◯月◯日）
- 整体師
- 法人
- ステータス（pending / approved / rejected / cancelled / completed）
- 症状
- 社員名・社員ID

---

## 5. 予約フロー

```
[整体師] 空き枠を登録
    ↓
[法人担当者] 空き枠を選択して予約申込
    ↓ （社員名 + 社員ID + 症状 + 要望を入力）
    ↓ （枠がロック: status = pending）
    ↓
[整体師] 予約申込の通知を受信
    ↓
[整体師] 予約を承認 or 拒否
    ↓
    ├─ [承認] → status = approved
    │         → 法人担当者に通知
    │         → 前日20時にリマインド通知
    │         → 施術実施
    │         → 整体師が施術後レポート記入
    │         → status = completed
    │
    └─ [拒否] → status = rejected
              → 拒否理由を記入
              → 法人担当者に通知
              → 枠が再度available状態に戻る
```

---

## 6. データベース設計

### 6.1 テーブル一覧

1. **users** - ユーザー（管理者・整体師・法人担当者）
2. **companies** - 法人情報
3. **therapists** - 整体師の追加情報
4. **service_menus** - 施術メニュー
5. **symptoms** - 症状マスター
6. **available_slots** - 空き枠
7. **appointments** - 予約
8. **treatment_records** - 施術記録
9. **treatment_symptoms** - 施術記録と症状の中間テーブル
10. **monthly_reports** - 月次レポート
11. **invoices** - 請求書
12. **notifications** - 通知

### 6.2 主要テーブル定義

#### users
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'therapist', 'company_user')),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### companies
```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### therapists
```sql
CREATE TABLE public.therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number TEXT,
  specialties TEXT[],
  bio TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### service_menus
```sql
CREATE TABLE public.service_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### symptoms
```sql
CREATE TABLE public.symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### available_slots
```sql
CREATE TABLE public.available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  service_menu_id UUID NOT NULL REFERENCES service_menus(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'pending', 'booked', 'cancelled')
  ),
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);
```

**status説明:**
- `available`: 予約可能
- `pending`: 予約申込中（ロック）
- `booked`: 予約確定
- `cancelled`: キャンセル済み

#### appointments
```sql
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID UNIQUE NOT NULL REFERENCES available_slots(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  employee_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  symptoms TEXT[],
  notes TEXT,
  rejected_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**status説明:**
- `pending`: 承認待ち
- `approved`: 承認済み（予約確定）
- `rejected`: 拒否
- `cancelled`: キャンセル済み
- `completed`: 施術完了

#### treatment_records
```sql
CREATE TABLE public.treatment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE RESTRICT,
  treatment_content TEXT NOT NULL,
  patient_condition TEXT NOT NULL,
  improvement_level INTEGER CHECK (improvement_level BETWEEN 1 AND 5),
  satisfaction_level INTEGER CHECK (satisfaction_level BETWEEN 1 AND 5),
  actual_duration_minutes INTEGER,
  next_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### treatment_symptoms
```sql
CREATE TABLE public.treatment_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
  symptom_id UUID NOT NULL REFERENCES symptoms(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(treatment_record_id, symptom_id)
);
```

#### monthly_reports
```sql
CREATE TABLE public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_appointments INTEGER NOT NULL,
  total_employees INTEGER NOT NULL,
  unique_employees INTEGER NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  average_improvement DECIMAL(3,2),
  average_satisfaction DECIMAL(3,2),
  symptom_breakdown JSONB,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year, month)
);
```

#### invoices
```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_amount INTEGER NOT NULL,
  appointment_count INTEGER NOT NULL,
  pdf_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year, month)
);
```

#### notifications
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('appointment_requested', 'appointment_approved', 'appointment_rejected', 'reminder')
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 初期データ（seed）

```sql
-- 症状マスター
INSERT INTO symptoms (name, display_order) VALUES
  ('肩こり', 1),
  ('腰痛', 2),
  ('頭痛', 3),
  ('首痛', 4);

-- 施術メニュー
INSERT INTO service_menus (name, duration_minutes, price, description) VALUES
  ('初回カウンセリング+整体', 120, 15000, '初回限定の丁寧なカウンセリングと施術'),
  ('基本整体', 60, 8000, '通常の整体施術');
```

---

## 7. 技術スタック

### 7.1 フロントエンド・バックエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (UIコンポーネント)

### 7.2 データベース・認証
- **Supabase**
  - PostgreSQL
  - Supabase Auth
  - Row Level Security (RLS)
  - Realtime subscriptions

### 7.3 カレンダー
- **react-big-calendar**

### 7.4 PDF生成
- **@react-pdf/renderer**

### 7.5 グラフ・チャート
- **Recharts**

### 7.6 メール送信
- **Resend**

### 7.7 スケジューラー
- **Vercel Cron Jobs**

### 7.8 デプロイ
- **Vercel**

### 7.9 バージョン管理
- **Git / GitHub**

---

## 8. 画面一覧

### 8.1 共通画面
- ログイン画面
- パスワード変更画面（初回ログイン時強制）

### 8.2 管理者画面
- ダッシュボード
  - 今日の予約一覧
  - 今週の予約数
  - 承認待ち件数
- 法人管理
  - 法人一覧
  - 法人登録・編集
  - 法人担当者登録
- 整体師管理
  - 整体師一覧
  - 整体師登録・編集
- マスターデータ管理
  - 施術メニュー管理
  - 症状マスター管理
- スケジュール管理（全体）
- 予約管理（全体）
- 施術履歴（全体）
- レポート生成
  - 健康経営レポート生成
  - 請求書・領収書生成

### 8.3 整体師画面
- ダッシュボード
  - 今日のスケジュール
  - 承認待ち件数
  - 今週の予約数
- 空き枠管理
  - 空き枠登録
  - 空き枠一覧・削除
- スケジュール閲覧（全体）
- 予約管理
  - 自分宛の予約一覧
  - 予約承認・拒否
- 施術履歴
  - 全員の施術履歴閲覧
  - 施術後レポート記入

### 8.4 法人担当者画面
- ダッシュボード
  - 次回予約情報
  - 今月の利用状況
  - 承認待ちの予約
- 予約申込
  - 空き枠カレンダー
  - 予約申込フォーム
- 予約管理
  - 自社の予約一覧
  - 予約キャンセル
- 施術履歴
  - 自社の施術履歴閲覧

---

## 9. 通知仕様

### 9.1 通知方法
- メール（Resend経由）
- アプリ内通知
- 将来機能: LINE連携

### 9.2 通知タイミング

| イベント | 通知先 | タイミング | 内容 |
|---------|--------|-----------|------|
| 予約申込 | 整体師 | 即時 | 新しい予約申込が届きました |
| 予約承認 | 法人担当者 | 即時 | 予約が承認されました |
| 予約拒否 | 法人担当者 | 即時 | 予約が拒否されました（拒否理由含む） |
| リマインド | 法人担当者 + 整体師 | 前日20:00 | 明日の予約のリマインド |

### 9.3 メールテンプレート

#### 予約申込通知（整体師宛）
```
件名: 【新規予約申込】◯月◯日 ◯◯時〜

◯◯様

新しい予約申込が届きました。

【予約詳細】
日時: ◯年◯月◯日（◯）◯◯:◯◯-◯◯:◯◯
メニュー: ◯◯
法人: ◯◯株式会社
社員名: ◯◯様
症状: ◯◯、◯◯
要望: ◯◯

管理画面から承認・拒否をお願いします。
https://your-app-url.com/appointments
```

#### 予約承認通知（法人担当者宛）
```
件名: 【予約確定】◯月◯日 ◯◯時〜

◯◯株式会社 ◯◯様

予約が確定しました。

【予約詳細】
日時: ◯年◯月◯日（◯）◯◯:◯◯-◯◯:◯◯
メニュー: ◯◯
社員名: ◯◯様
担当整体師: ◯◯

当日はよろしくお願いいたします。

詳細はこちら:
https://your-app-url.com/appointments
```

---

## 10. レポート・請求機能

### 10.1 健康経営レポート

#### 10.1.1 生成タイミング
- 毎月1日午前4:00に自動生成（Vercel Cron Jobs）
- 管理者が手動で生成可能

#### 10.1.2 レポート内容
- 対象期間: 前月1日〜末日
- 含まれる情報:
  - 施術実施回数（月次）
  - 利用社員数
    - 延べ人数
    - 実人数（社員IDで識別）
  - 主な症状の内訳（円グラフ）
  - 改善度の集計（平均値・分布）
  - 満足度の集計（平均値・分布）
  - 施術時間の総計
  - 月次推移グラフ

#### 10.1.3 MVP範囲
- 基本集計データ + グラフ
- PDF出力
- 手動生成のみ（自動生成は将来機能）

### 10.2 請求書・領収書

#### 10.2.1 生成タイミング
- 毎月1日午前3:00に自動生成（Vercel Cron Jobs）
- 管理者が手動で生成可能

#### 10.2.2 請求書内容
- 宛名: 法人名
- 対象期間: 前月1日〜末日
- 明細:
  - 施術メニュー × 回数 × 単価
  - 合計金額
- 但し書き: 「整体施術代として」
- 印鑑・署名: なし（MVP範囲）

#### 10.2.3 領収書内容
- 請求書と同じ内容
- 発行日を記載

---

## 11. 制約事項・ビジネスルール

### 11.1 予約の制約
- 予約可能期間: 制限なし（未来の日付なら何日先でもOK）
- 最短予約期間: 3日前まで
- キャンセル期限: 前日20時まで
- 1法人が同時に複数予約: 可能
- 同じ社員IDで複数予約: 可能
- 日時変更: 不可（キャンセル→再予約）

### 11.2 空き枠の制約
- 整体師が手動で1つずつ登録
- 予約なしの枠は削除・変更可能
- 過去の空き枠（available）は施術日時から1週間経過後に自動削除
- 整体師が退職した場合、未来の空き枠は削除

### 11.3 承認・拒否の制約
- 整体師の承認・拒否に期限なし
- 承認待ち（pending）の予約は無制限に保持
- 拒否時は拒否理由の入力必須

### 11.4 アカウント管理
- 法人担当者は管理者が登録（初期パスワード発行）
- 初回ログイン時にパスワード変更を強制
- 整体師が退職した場合、アカウント無効化（is_active = false）
- 退職した整体師の施術履歴は残る（整体師名も表示）

### 11.5 出張エリア
- 制限なし（管理者が個別に判断）

---

## 12. セキュリティ要件

### 12.1 認証
- Supabase Authを使用
- メール + パスワード認証
- 初回ログイン時のパスワード変更強制

### 12.2 認可（Row Level Security）
- ユーザーの役割（role）に応じたアクセス制御
- 法人担当者は自社のデータのみアクセス可能
- 整体師は全データを閲覧可能（編集は制限）
- 管理者は全データにアクセス可能

### 12.3 データ保護
- パスワードはハッシュ化して保存
- HTTPS通信の強制
- 個人情報（社員名、社員ID）の適切な管理

---

## 13. 非機能要件

### 13.1 パフォーマンス
- ページ読み込み時間: 2秒以内
- データベースクエリの最適化（インデックス活用）

### 13.2 可用性
- 稼働率: 99%以上
- Vercelの自動スケーリング活用

### 13.3 保守性
- TypeScriptによる型安全性
- コンポーネントの再利用性
- コードの可読性（コメント、命名規則）

### 13.4 モバイル対応
- レスポンシブデザイン（MVP範囲: 予約確認・承認のみ）
- 将来的に全機能をモバイル対応
- PWA化（将来機能）

### 13.5 バックアップ
- Supabaseの自動バックアップ機能を活用
- 日次バックアップ

---

## 14. 将来機能（MVP範囲外）

### 14.1 短期（3-6ヶ月以内）
- 空き枠の繰り返し一括登録
- LINE連携通知
- 健康経営レポートの自動生成
- CSVエクスポート機能

### 14.2 中期（6-12ヶ月以内）
- 会計ソフト連携（freee、マネーフォワードなど）
- 詳細な分析ダッシュボード
- カスタマイズ可能なレポート
- PWA対応

### 14.3 長期（12ヶ月以降）
- ネイティブアプリ化（Capacitor）
- 他業種への横展開（美容室、マッサージなど）
- SaaS化（複数の整体院で利用可能に）
- AIによる最適スケジュール提案

---

## 15. 開発スケジュール

### Phase 1: 環境構築・基盤（2-3週間）
- [ ] Supabaseプロジェクト作成
- [ ] Next.jsプロジェクト作成
- [ ] データベース設計・マイグレーション実行
- [ ] 認証機能実装（Supabase Auth）
- [ ] RLS設定

### Phase 2: ユーザー管理（2週間）
- [ ] ユーザー登録・編集画面
- [ ] 法人管理画面
- [ ] 整体師管理画面
- [ ] ロール別のアクセス制御

### Phase 3: スケジュール・予約機能（4-5週間）
- [ ] 空き枠登録機能
- [ ] カレンダー表示（react-big-calendar）
- [ ] 予約申込フォーム
- [ ] 予約承認・拒否機能
- [ ] 予約キャンセル機能
- [ ] 検索・フィルター機能

### Phase 4: 施術管理（3週間）
- [ ] 施術後レポート記入フォーム
- [ ] 施術履歴一覧・詳細
- [ ] マスターデータ管理画面
  - [ ] 施術メニュー管理
  - [ ] 症状マスター管理

### Phase 5: 通知機能（2-3週間）
- [ ] Resend設定
- [ ] メール送信機能
- [ ] アプリ内通知機能
- [ ] 通知テンプレート作成

### Phase 6: レポート・請求機能（3-4週間）
- [ ] PDF生成機能（@react-pdf/renderer）
- [ ] 健康経営レポート生成
- [ ] 請求書・領収書生成
- [ ] グラフ・チャート表示（Recharts）

### Phase 7: ダッシュボード（2週間）
- [ ] 管理者ダッシュボード
- [ ] 整体師ダッシュボード
- [ ] 法人担当者ダッシュボード

### Phase 8: Cron Jobs・自動処理（1週間）
- [ ] Vercel Cron Jobs設定
- [ ] 空き枠の自動削除
- [ ] 月次レポート自動生成
- [ ] 月次請求書自動生成
- [ ] リマインド通知自動送信

### Phase 9: テスト・バグ修正（2-3週間）
- [ ] 機能テスト
- [ ] ユーザビリティテスト
- [ ] バグ修正
- [ ] パフォーマンス最適化

### Phase 10: 本番リリース（1週間）
- [ ] Vercelデプロイ
- [ ] カスタムドメイン設定
- [ ] 本番データ投入
- [ ] 最終動作確認
- [ ] リリース

**総開発期間: 約5ヶ月（320時間）**

---

## 付録

### A. 用語集
- **MVP**: Minimum Viable Product（必要最小限の機能を持つ製品）
- **RLS**: Row Level Security（行レベルセキュリティ）
- **Cron**: 定期的にタスクを実行するスケジューラー
- **PWA**: Progressive Web App（Webアプリをアプリ風にする技術）

### B. 参考資料
- Supabase公式ドキュメント: https://supabase.com/docs
- Next.js公式ドキュメント: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com/
- react-big-calendar: https://github.com/jquense/react-big-calendar
- Resend: https://resend.com/docs

---

**作成者**: SEとして要件定義・PM経験を持つ開発者  
**承認者**: 中川利右司（Lead off Health 整体院）  
**最終更新日**: 2025年10月21日