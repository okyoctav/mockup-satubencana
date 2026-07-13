-- ACL + RBAC for Admin/Management
-- Assumptions:
-- - Use Supabase Auth (auth.users)
-- - Store app-level roles in app_roles
-- - Map user_id -> role in app_users.role
-- - Default role for new users: 'viewer'
-- - Admin access controlled via RLS

begin;

-- =========================
-- Enum role (matches AppRole)
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'viewer');
  end if;
end $$;

-- =========================
-- Roles table (for CRUD management)
-- =========================
create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_app_roles_updated_at on public.app_roles;
create trigger tr_app_roles_updated_at
before update on public.app_roles
for each row execute function public.set_updated_at();

-- =========================
-- Users table mapped to Auth users
-- =========================
create table if not exists public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users add column if not exists email text;
create unique index if not exists app_users_email_key on public.app_users (email);

drop trigger if exists tr_app_users_updated_at on public.app_users;
create trigger tr_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

-- =========================
-- Seed default roles
-- =========================
insert into public.app_roles (role, active)
values
  ('admin', true),
  ('viewer', true)
on conflict (role) do update
set active = excluded.active;

-- Sync email from auth.users for existing rows
update public.app_users au
set email = u.email
from auth.users u
where au.user_id = u.id
  and (au.email is null or au.email <> u.email);

-- Ensure bcrypt support is available for password hashing
create extension if not exists pgcrypto;

-- Create a default admin auth user for email/password login.
-- Email: admin@admin.com
-- Password: admin123
-- If the user already exists, the password will be reset to admin123.
do $$
begin
  if not exists (select 1 from auth.users where lower(email) = lower('admin@admin.com')) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      is_sso_user
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb,
      false,
      false
    );
  end if;
end $$;

update auth.users
set encrypted_password = crypt('admin123', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where lower(email) = lower('admin@admin.com');

-- Seed app-level admin role for that Auth user
insert into public.app_users (user_id, email, role)
select u.id, u.email, 'admin'
from auth.users u
where lower(u.email) = lower('admin@admin.com')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role;

-- =========================
-- RLS
-- =========================
alter table public.app_roles enable row level security;
alter table public.app_users enable row level security;

-- Helper: is admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1
    from public.app_users au
    where au.user_id = auth.uid()
      and au.role = 'admin'
  );
$$ language sql stable;

-- app_users policies
-- 1) A user can read their own row
drop policy if exists "app_users_select_own" on public.app_users;
create policy "app_users_select_own"
on public.app_users
for select
using (user_id = auth.uid());

-- 2) Admin can read all
drop policy if exists "app_users_select_admin" on public.app_users;
create policy "app_users_select_admin"
on public.app_users
for select
using (public.is_admin());

-- 3) A user can update their own role only if they are admin? (default: no self-escalation)
-- For simplicity, disallow user updates entirely; admin manages.
drop policy if exists "app_users_no_user_update" on public.app_users;
create policy "app_users_no_user_update"
on public.app_users
for update
using (false)
with check (false);

-- 4) Admin can update all
drop policy if exists "app_users_update_admin" on public.app_users;
create policy "app_users_update_admin"
on public.app_users
for update
using (public.is_admin())
with check (public.is_admin());

-- app_roles policies
-- Admin full access
drop policy if exists "app_roles_admin_all" on public.app_roles;
create policy "app_roles_admin_all"
on public.app_roles
for all
using (public.is_admin())
with check (public.is_admin());

-- Viewer read roles (active only)
drop policy if exists "app_roles_viewer_read_active" on public.app_roles;
create policy "app_roles_viewer_read_active"
on public.app_roles
for select
using (not public.is_admin() and active = true);

-- =========================
-- Trigger: seed app_users row on signup
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.app_users (user_id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (user_id) do update
  set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
