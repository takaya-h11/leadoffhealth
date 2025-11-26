# 004: Authentication Schema Setup

## 概要
Supabaseダッシュボードで認証設定を行い、必要なテーブルやポリシーを設定する。

## タスク

### 1. Email認証設定
- [ ] Supabaseダッシュボード > Authentication > Providersを開く
- [ ] Email providerが有効になっていることを確認
- [ ] "Confirm email"設定を確認（必要に応じて有効化）

### 2. Site URL設定
- [ ] Authentication > URL Configurationを開く
- [ ] Site URL: `http://localhost:3000`を設定（開発環境）
- [ ] Redirect URLs: `http://localhost:3000/**`を追加

### 3. ユーザープロファイルテーブル作成（オプション）
- [ ] SQL Editorを開く
- [ ] `profiles`テーブルを作成（必要に応じて）
  ```sql
  create table profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone,
    username text unique,
    full_name text,
    avatar_url text
  );

  -- Row Level Securityを有効化
  alter table profiles enable row level security;

  -- ポリシー作成: ユーザーは自分のプロファイルのみ閲覧可能
  create policy "Users can view own profile"
    on profiles for select
    using ( auth.uid() = id );

  -- ポリシー作成: ユーザーは自分のプロファイルのみ更新可能
  create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );
  ```

### 4. 認証トリガー設定（オプション）
- [ ] 新規ユーザー登録時に自動的にprofilesレコードを作成するトリガーを設定
  ```sql
  create function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, full_name, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
  end;
  $$ language plpgsql security definer;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
  ```

## 完了条件
- [ ] Email認証が有効になっている
- [ ] Site URLとRedirect URLsが設定されている
- [ ] 必要に応じてprofilesテーブルとポリシーが作成されている

## 依存チケット
- 001: Supabase Project Setup

## 参考資料
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
