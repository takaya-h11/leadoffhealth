# 024: 予約ステータス管理機能

## 概要
予約のステータス（pending → approved → completed）を管理し、適切な画面遷移とビジネスロジックを実装する。

## 前提条件
- ✅ 予約管理機能が実装されている（017-023完了）

## タスク

### 1. ステータス遷移図の実装
```
pending (承認待ち)
  ├─ approved (承認済み) → completed (完了)
  ├─ rejected (拒否)
  └─ cancelled (キャンセル)
```

### 2. ステータスバッジコンポーネント作成
```typescript
export function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
  }

  const labels = {
    pending: '承認待ち',
    approved: '承認済み',
    rejected: '拒否',
    cancelled: 'キャンセル',
    completed: '完了',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
```

### 3. ステータス更新バリデーション
```typescript
function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  const validTransitions = {
    pending: ['approved', 'rejected', 'cancelled'],
    approved: ['completed', 'cancelled'],
    rejected: [],
    cancelled: [],
    completed: [],
  }

  return validTransitions[currentStatus]?.includes(newStatus) || false
}
```

## 完了条件
- [ ] ステータス遷移が適切に制御される
- [ ] 不正な遷移は拒否される
- [ ] ステータスが視覚的に分かりやすい

## 依存チケット
- 017-023: 予約管理機能

## 次のステップ
- 025: 施術後レポート記入機能
