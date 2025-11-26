-- ============================================================================
-- デモユーザーのmust_change_passwordフラグ修正
-- ============================================================================
-- デモユーザーがログインできるように、must_change_passwordをfalseに設定します
-- ============================================================================

-- デモユーザーのmust_change_passwordをfalseに設定
UPDATE public.users
SET must_change_password = false
WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com');

-- 確認用: デモユーザーの状態を表示
-- SELECT id, email, role, must_change_password, is_active
-- FROM public.users
-- WHERE email IN ('admin@demo.com', 'therapist@demo.com', 'company@demo.com')
-- ORDER BY role;
