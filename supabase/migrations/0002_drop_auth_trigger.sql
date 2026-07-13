-- Remove legacy trigger/function that can break Supabase Auth password grants
-- This prevents auth.users inserts from running custom logic that may fail
-- during sign-in or sign-up.

begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

commit;
