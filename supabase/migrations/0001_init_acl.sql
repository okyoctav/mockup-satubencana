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
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
create policy "app_users_select_own"
on public.app_users
for select
using (user_id = auth.uid());

-- 2) Admin can read all
create policy "app_users_select_admin"
on public.app_users
for select
using (public.is_admin());

-- 3) A user can update their own role only if they are admin? (default: no self-escalation)
-- For simplicity, disallow user updates entirely; admin manages.
create policy "app_users_no_user_update"
on public.app_users
for update
using (false)
with check (false);

-- 4) Admin can update all
create policy "app_users_update_admin"
on public.app_users
for update
using (public.is_admin())
with check (public.is_admin());

-- app_roles policies
-- Admin full access
create policy "app_roles_admin_all"
on public.app_roles
for all
using (public.is_admin())
with check (public.is_admin());

-- Viewer read roles (active only)
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
  insert into public.app_users (user_id, role)
  values (new.id, 'viewer')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

commit;
