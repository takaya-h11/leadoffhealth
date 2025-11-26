# 🚨 デモアカウント ログイン修正 - 今すぐ実行

## 簡単な修正方法

Supabase Dashboard（https://supabase.com/dashboard）を開いて、以下のSQLを実行してください：

### 📋 このSQLをコピーして実行：

```sql
UPDATE public.users
SET must_change_password = false
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');
```

### 実行手順：

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にアクセス
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左メニューから "SQL Editor" をクリック
   - "+ New query" をクリック

3. **SQLを貼り付けて実行**
   - 上記のSQLをコピー＆ペースト
   - "Run" ボタンをクリック

4. **確認**
   - 以下のSQLで確認：
   ```sql
   SELECT email, role, must_change_password, is_active
   FROM public.users
   WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');
   ```
   - すべて `must_change_password` が `false` になっていればOK

5. **ログインテスト**
   - http://localhost:3000/login にアクセス
   - "デモログイン"ボタンで各ロールでログインできることを確認

---

## ✅ 完了！

これでデモアカウントでログインできるようになります。

**デモアカウント情報：**
- 管理者: admin@demo.com / demo123
- 整体師: therapist@demo.com / demo123
- 法人担当者: company@demo.com / demo123
