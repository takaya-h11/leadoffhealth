-- 孤立したAuth usersをクリーンアップ
-- usersテーブルに存在しないauth.usersのユーザーを見つけるクエリ

-- 1. まず確認（削除前に確認してください）
SELECT
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. 孤立ユーザーを削除（注意: 実行前に上記の確認クエリを実行してください）
-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN public.users pu ON au.id = pu.id
--   WHERE pu.id IS NULL
-- );
