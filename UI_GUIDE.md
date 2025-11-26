# 🎨 Lead off Health - UIテーマガイド

## 概要

このアプリケーションには、**クラシックUI**と**モダンUI**の2つのテーマが実装されています。
ユーザーは画面右上のボタンでいつでもテーマを切り替えることができます。

## テーマの切り替え方法

### 1. テーマ切り替えボタン
画面右上（ナビゲーションバー内）にあるボタンをクリックするだけです：
- **✨ モダンUI** - 華やかなグラデーション＋アニメーション
- **📋 クラシックUI** - シンプルで使いやすい標準デザイン

### 2. 設定の保存
選択したテーマはブラウザのlocalStorageに保存されるため、ページをリロードしても設定が保持されます。

---

## 📋 クラシックUI

### 特徴
- **シンプル**: 白背景＋グレーのボーダー
- **読みやすい**: 標準的なフォントとコントラスト
- **軽量**: アニメーションなし、高速レンダリング
- **プロフェッショナル**: ビジネス用途に最適

### デザイン要素
```css
背景: bg-gray-50
カード: bg-white, border-gray-200
ボタン: bg-blue-600, hover:bg-blue-700
テキスト: text-gray-900
```

### 適用画面
- ホームページ
- ナビゲーションバー
- 全ダッシュボード（管理者、整体師、法人担当者）
- 統計カード
- クイックリンク

---

## ✨ モダンUI

### 特徴
- **華やか**: グラデーション背景＋ガラスモーフィズム
- **アニメーション**: hover時のスケール変換、シャドウ効果
- **カラフル**: ブルー、パープル、ピンクのグラデーション
- **最先端**: モダンなWebデザイントレンド

### デザイン要素

#### 背景
```css
bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30
```

#### カード（ModernCard）
```tsx
<ModernCard gradient="blue" hover>
  {/* コンテンツ */}
</ModernCard>
```

**利用可能なグラデーション:**
- `blue`: 青→シアン
- `purple`: 紫→ピンク
- `pink`: ピンク→ローズ
- `green`: グリーン→ティール
- `orange`: オレンジ→イエロー
- `cyan`: シアン→ブルー

#### ボタン（ModernButton）
```tsx
<ModernButton variant="primary" size="lg">
  クリック
</ModernButton>
```

**バリエーション:**
- `primary`: ブルー→パープルのグラデーション
- `secondary`: グレー→スレートのグラデーション
- `success`: グリーン→ティールのグラデーション
- `danger`: レッド→ピンクのグラデーション
- `warning`: オレンジ→イエローのグラデーション

**サイズ:**
- `sm`: 小さいボタン（padding: 3px 12px）
- `md`: 中サイズボタン（padding: 4px 16px）- デフォルト
- `lg`: 大きいボタン（padding: 6px 24px）

### 適用画面
- ホームページ（グラデーションロゴ、グラデーションテキスト）
- ナビゲーションバー（グラデーション背景、ガラス効果）
- 管理者ダッシュボード（統計カード、クイックリンク）
- 整体師ダッシュボード（レポート記入待ち、今日の予約）
- 法人担当者ダッシュボード（次回予約、統計）

---

## 🛠️ 開発者向け情報

### テーマContextの使い方

```tsx
'use client';

import { useTheme } from '@/contexts/ThemeContext';

export function MyComponent() {
  const { isModern, theme, toggleTheme, mounted } = useTheme();

  return (
    <div className={isModern ? 'modern-style' : 'classic-style'}>
      {/* コンテンツ */}
    </div>
  );
}
```

### 共通コンポーネント

#### 1. ModernCard
```tsx
import { ModernCard } from '@/components/ui/ModernCard';

<ModernCard gradient="blue" hover>
  <div className="p-6">
    {/* コンテンツ */}
  </div>
</ModernCard>
```

**Props:**
- `gradient?: 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'cyan'`
- `hover?: boolean` - hover時のスケール効果を有効化
- `className?: string` - 追加のCSSクラス

#### 2. ModernButton
```tsx
import { ModernButton } from '@/components/ui/ModernButton';

<ModernButton variant="primary" size="md" onClick={handleClick}>
  ボタンテキスト
</ModernButton>
```

**Props:**
- `variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'`
- `size?: 'sm' | 'md' | 'lg'`
- その他、標準のbutton HTMLAttributes

#### 3. ThemeToggle
```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

<ThemeToggle />
```

テーマ切り替えボタン。自動的に現在のテーマを検出して表示を変更します。

### グローバルスタイル

#### カスタムアニメーション
```css
.animate-fade-in { /* フェードイン */ }
.animate-slide-in { /* スライドイン */ }
.animate-pulse-subtle { /* 繊細なパルス */ }
```

#### ユーティリティクラス
```css
.gradient-text { /* グラデーションテキスト */ }
.glass { /* ガラスモーフィズム */ }
.shadow-modern { /* モダンなシャドウ */ }
.shadow-modern-lg { /* 大きなモダンシャドウ */ }
```

### react-big-calendarのスタイリング

モダンUIモードでは、カレンダーも自動的にスタイリングされます：
- 丸い角
- グラデーション背景（今日の日付、選択中）
- hover効果
- スムーズなトランジション

---

## 🎨 カラーパレット

### プライマリカラー
- **ブルー**: `#3B82F6` (blue-600)
- **パープル**: `#8B5CF6` (purple-600)
- **ピンク**: `#EC4899` (pink-600)

### セカンダリカラー
- **シアン**: `#06B6D4` (cyan-600)
- **グリーン**: `#10B981` (green-600)
- **オレンジ**: `#F97316` (orange-600)

### グレースケール
- **背景**: `#F9FAFB` (gray-50)
- **テキスト**: `#111827` (gray-900)
- **ボーダー**: `#E5E7EB` (gray-200)

---

## 📱 レスポンシブデザイン

両テーマとも、以下のブレークポイントでレスポンシブに対応しています：

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

---

## ✅ 対応状況

### ✅ 完全対応
- [x] ホームページ
- [x] ナビゲーションバー
- [x] 管理者ダッシュボード
- [x] 整体師ダッシュボード
- [x] 法人担当者ダッシュボード
- [x] 統計カード
- [x] クイックリンク

### 🚧 今後の対応予定
- [ ] 予約一覧ページ
- [ ] 施術履歴ページ
- [ ] カレンダーページ
- [ ] フォーム画面
- [ ] モーダルダイアログ
- [ ] テーブル表示

---

## 🚀 パフォーマンス

### クラシックUI
- 軽量、高速レンダリング
- アニメーションなし
- シンプルなCSS

### モダンUI
- 最適化されたアニメーション（GPU加速）
- レイジーローディング
- CSS-in-JSではなくTailwind CSSを使用

両テーマとも、パフォーマンスに大きな影響はありません。

---

## 🎯 推奨事項

### いつクラシックUIを使うべきか
- ビジネス・公式な場面
- 高速なレンダリングが必要な場合
- シンプルで分かりやすいUIが必要な場合

### いつモダンUIを使うべきか
- プレゼンテーション・デモ
- 視覚的なインパクトが必要な場合
- 最新のデザイントレンドをアピールしたい場合

---

## 📝 まとめ

Lead off Healthの予約管理システムは、2つのUIテーマを提供しており、ユーザーの好みやシーンに応じて切り替えることができます。

**クラシックUI** = シンプル・高速・プロフェッショナル
**モダンUI** = 華やか・アニメーション・最先端

どちらのテーマも、使いやすさと視認性を重視して設計されています。

---

**Last Updated**: 2025-10-26
**Version**: 1.0.0
