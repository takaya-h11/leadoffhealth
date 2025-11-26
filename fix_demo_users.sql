-- デモユーザーのmust_change_passwordをfalseに設定
-- これにより、パスワード変更を求められずにログインできるようになります

UPDATE public.users
SET must_change_password = false
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- 確認用クエリ
SELECT id, email, role, must_change_password, is_active
FROM public.users
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
ORDER BY role;
