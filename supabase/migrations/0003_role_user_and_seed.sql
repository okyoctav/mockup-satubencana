-- Ganti role 'viewer' → 'user' (keputusan produk 19 Nov 2026).
-- Aman untuk DB baru (setelah 0001) maupun DB yang sudah punya 'viewer'.

begin;

-- 1) Buat enum baru
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role_v2') then
    create type public.app_role_v2 as enum ('admin', 'user');
  end if;
end $$;

-- 2) app_users: pindah ke enum baru
alter table public.app_users alter column role drop default;

alter table public.app_users
  alter column role type public.app_role_v2
  using (
    case
      when role::text = 'admin' then 'admin'::public.app_role_v2
      else 'user'::public.app_role_v2
    end
  );

alter table public.app_users
  alter column role set default 'user'::public.app_role_v2;

-- 3) app_roles: rebuild baris dengan enum baru
alter table public.app_roles alter column role type text;

update public.app_roles set role = 'user' where role = 'viewer';

alter table public.app_roles
  alter column role type public.app_role_v2
  using (role::public.app_role_v2);

insert into public.app_roles (role, active)
values
  ('admin'::public.app_role_v2, true),
  ('user'::public.app_role_v2, true)
on conflict (role) do update set active = excluded.active;

delete from public.app_roles where role::text = 'viewer';

-- 4) Ganti tipe lama
drop type public.app_role;
alter type public.app_role_v2 rename to app_role;

-- 5) Policy baca untuk non-admin
drop policy if exists "app_roles_viewer_read_active" on public.app_roles;
drop policy if exists "app_roles_user_read_active" on public.app_roles;
create policy "app_roles_user_read_active"
on public.app_roles
for select
using (not public.is_admin() and active = true);

-- 6) Jangan biarkan akun demo lama sebagai admin
update public.app_users
set role = 'user'
where lower(coalesce(email, '')) = lower('admin@admin.com');

commit;
