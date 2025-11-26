# Supabase URL Configuration Guide

## 概要
Email確認やパスワードリセットなどの認証フローが正しく動作するために、Supabase側でリダイレクトURLを設定する必要があります。

## 設定手順

### 1. Supabaseダッシュボードにアクセス
- URL: https://supabase.com/dashboard/project/jtdaguehanvqozhhfxru
- ログインしていない場合はログイン

### 2. Authentication設定を開く
1. 左サイドバーから「Authentication」をクリック
2. 「URL Configuration」タブをクリック

### 3. Site URLの設定
**開発環境:**
```
http://localhost:3000
```

**本番環境（デプロイ後）:**
```
https://your-domain.vercel.app
```

### 4. Redirect URLsの追加

以下のURLを「Redirect URLs」セクションに追加します：

**開発環境:**
```
http://localhost:3000/auth/confirm
http://localhost:3001/auth/confirm
http://localhost:3002/auth/confirm
```

**本番環境（デプロイ後）:**
```
https://your-domain.vercel.app/auth/confirm
```

### 5. ワイルドカードの使用（オプション）

開発環境で複数のポートを使用する場合、以下のようにワイルドカードを使用できます：

```
http://localhost:*/auth/confirm
```

ただし、本番環境では**セキュリティ上の理由から具体的なURLを指定**することを強く推奨します。

## 設定後の確認

### 1. Email確認フローのテスト

1. `/login`ページにアクセス
2. 新しいメールアドレスとパスワードでサインアップ
3. 登録したメールアドレスに確認メールが届く
4. メール内の「Confirm your email」リンクをクリック
5. `/auth/confirm`経由で認証が完了
6. `/dashboard`にリダイレクトされる

### 2. エラーが発生した場合

#### "Invalid Redirect URL"エラー
- Redirect URLsに正しいURLが追加されているか確認
- プロトコル（http/https）が正しいか確認
- ポート番号が正しいか確認

#### "Authentication failed"メッセージ
- メール内のリンクの有効期限が切れていないか確認（通常24時間）
- 同じリンクを2回以上使用していないか確認
- ブラウザのキャッシュをクリアして再試行

## 本番環境デプロイ時の注意事項

1. **Site URLの更新**
   - Vercelなどにデプロイ後、実際のドメインに更新

2. **Redirect URLsの追加**
   - 本番ドメインを追加
   - 開発用のlocalhostは残しておいてOK

3. **環境変数の確認**
   - Vercelの環境変数に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されているか確認

## 関連ドキュメント

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## トラブルシューティング

### メールが届かない場合

1. **迷惑メールフォルダを確認**
   - Supabaseからのメールが迷惑メールに分類されている可能性

2. **Supabase Email設定を確認**
   - Authentication > Email Templates
   - テンプレートが正しく設定されているか確認

3. **Email Provider設定を確認**
   - 本番環境では独自のSMTPサーバーまたはSendGrid/Resendなどのサービスを使用することを推奨

### リダイレクトが正しく動作しない場合

1. **ミドルウェアの確認**
   - `middleware.ts`が正しく設定されているか確認
   - `/auth/confirm`がミドルウェアの対象に含まれているか確認

2. **ブラウザのコンソールを確認**
   - エラーメッセージがないか確認
   - ネットワークタブでリダイレクトの流れを確認

3. **Supabaseログを確認**
   - Supabase Dashboard > Logs > Auth Logs
   - 認証の失敗理由を確認
