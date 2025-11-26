# 人体図の閲覧モード修正

## 🐛 問題

詳細画面で人体図は表示されるが、描画した赤い線、メモ、ピンが再現されない。

## 🔍 原因

**`useBodyDiagram` フックの初期化タイミングの問題**

`useBodyDiagram` フックは、コンポーネントがマウントされた時に一度だけ `initialData` をチェックして state を初期化していました。

```typescript
// 問題のあったコード
const [data, setData] = useState<BodyDiagramData>(getInitialData);
```

しかし、閲覧モードでは:
1. コンポーネントがマウントされる（この時点では `initialData` はまだない）
2. サーバーからデータが取得される
3. `initialData` プロップが渡される
4. **しかし、state は更新されない！** ⬅ ここが問題

React の `useState` は**初回レンダリング時のみ**初期値を使用し、その後プロップが変更されても自動的には更新されません。

## ✅ 解決方法

### 1. `useBodyDiagram` フックに `useEffect` を追加

`initialData` プロップが変更されたら state を更新するようにしました。

**修正箇所**: `src/hooks/useBodyDiagram.ts:54-62`

```typescript
// Update data when initialData changes (important for readonly mode with async data)
useEffect(() => {
  if (initialData) {
    console.log('🔄 useBodyDiagram: initialData changed, updating state:', initialData);
    setData(initialData);
    setHistory([initialData]);
    setHistoryIndex(0);
  }
}, [initialData]);
```

### 2. 閲覧モード用のビュー切り替えボタンを追加

編集モードではツールバーでビューを切り替えられますが、閲覧モードではツールバーが表示されないため、ビューを切り替える方法がありませんでした。

**修正箇所**: `src/components/body-diagram/BodyDiagram.tsx:160-204`

```tsx
{/* View Switcher for readonly mode */}
{readonly && (
  <div className="mb-4 flex justify-center gap-2">
    <button onClick={() => setCurrentView('front')}>正面</button>
    <button onClick={() => setCurrentView('back')}>背面</button>
    <button onClick={() => setCurrentView('left')}>左側面</button>
    <button onClick={() => setCurrentView('right')}>右側面</button>
  </div>
)}
```

### 3. デバッグ用ログの追加

問題の診断を容易にするため、閲覧モードでのデータ読み込み状況を確認できるログを追加しました。

**修正箇所**: `src/components/body-diagram/BodyDiagram.tsx:146-156`

```typescript
React.useEffect(() => {
  if (readonly) {
    console.log('📊 [READONLY] BodyDiagram rendering with data:', data);
    console.log('📊 [READONLY] Current view:', currentView);
    console.log('📊 [READONLY] Strokes count:', data.views[currentView].strokes.length);
    console.log('📊 [READONLY] Annotations count:', data.views[currentView].annotations.length);
    console.log('📊 [READONLY] Pins count:', data.views[currentView].pins.length);
  }
}, [readonly, data, currentView]);
```

## 📋 修正ファイル一覧

1. **src/hooks/useBodyDiagram.ts**
   - `useEffect` のインポート追加
   - `initialData` 変更時の state 更新ロジック追加

2. **src/components/body-diagram/BodyDiagram.tsx**
   - 閲覧モード用のビュー切り替えボタン追加
   - デバッグ用ログ追加

## 🧪 テスト方法

### 1. 人体図データを保存
1. 施術レポート作成/編集画面を開く
2. 人体図を開く
3. ペンツールで赤い線を描く
4. テキストやピンを追加
5. 「保存」ボタンをクリック
6. フォームを送信

### 2. 閲覧モードで確認
1. 施術レポート詳細画面を開く
2. 人体図セクションが表示される
3. **描画した線、メモ、ピンが表示されることを確認**
4. ビュー切り替えボタン（正面・背面・左側面・右側面）で切り替え
5. 各ビューで保存したデータが表示されることを確認

### 3. ブラウザコンソールでログ確認

期待されるログ:
```
🔄 useBodyDiagram: initialData changed, updating state: {views: {...}, metadata: {...}}
📊 [READONLY] BodyDiagram rendering with data: {views: {...}, metadata: {...}}
📊 [READONLY] Current view: front
📊 [READONLY] Strokes count: 1  ⬅ 描画した線の数
📊 [READONLY] Annotations count: 0
📊 [READONLY] Pins count: 0
```

もし `Strokes count: 0` と表示される場合:
- `initialData` が正しく渡されていない
- または保存時に問題が発生している可能性

## 🎯 技術的な詳細

### React の useState vs useEffect

**useState の挙動:**
```typescript
// 初回レンダリング時のみ initialData を使用
const [data, setData] = useState(initialData);

// その後 initialData が変更されても、data は自動更新されない
```

**useEffect で対応:**
```typescript
useEffect(() => {
  // initialData が変更されるたびに実行される
  if (initialData) {
    setData(initialData);
  }
}, [initialData]); // 依存配列に initialData を指定
```

### なぜ編集モードでは問題なかったのか？

編集モードでは:
1. ユーザーが描画する
2. `addStroke` などの関数で直接 state を更新
3. `initialData` プロップは使わない（または空）

閲覧モードでは:
1. サーバーから既存データを取得
2. `initialData` プロップとして渡す
3. この `initialData` を state に反映する必要がある ⬅ ここが欠けていた

## ✅ 確認事項

- [x] `useBodyDiagram` フックが `initialData` の変更を検知
- [x] 閲覧モードでビューを切り替え可能
- [x] デバッグログで問題診断が可能
- [x] 既存の編集モードの動作に影響なし

## 🚀 次回の改善案

1. **パフォーマンス最適化**
   - `initialData` の深い比較（現在は参照比較のみ）
   - メモ化による不要な再レンダリングの削減

2. **UI改善**
   - 閲覧モードでのズーム/パン機能
   - 各ビューに描画があるかどうかのインジケーター

3. **エラーハンドリング**
   - データ形式が不正な場合の fallback UI
   - 画像読み込み失敗時の代替表示
