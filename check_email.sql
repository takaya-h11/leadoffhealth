-- 333322aaaa@gmail.com がデータベースに存在するか確認

-- public.usersテーブルをチェック
SELECT 'public.users' as table_name, id, email, full_name, role, is_active, created_at
FROM public.users
WHERE email = '333322aaaa@gmail.com';

-- auth.usersテーブルをチェック
SELECT 'auth.users' as table_name, id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = '333322aaaa@gmail.com';

-- 類似のメールアドレスがないかチェック
SELECT 'similar_emails' as table_name, id, email, role
FROM public.users
WHERE email LIKE '%333322aaaa%';
