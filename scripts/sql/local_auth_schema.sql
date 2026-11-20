-- Schema auth lokal (Postgres native, tanpa Supabase).
-- Role: admin | user  · Seed: superadmin@satubencana.id + user@satubencana.id

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.app_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  display_name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_users_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS app_users_email_lower_idx ON public.app_users (lower(email));

INSERT INTO public.app_roles (role, active)
VALUES
  ('admin', true),
  ('user', true)
ON CONFLICT (role) DO UPDATE SET active = EXCLUDED.active;

-- Password semua seed: admin123 (bcrypt via pgcrypto crypt/gen_salt)
INSERT INTO public.app_users (email, password_hash, role, display_name, active)
VALUES
  (
    'superadmin@satubencana.id',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'Superadmin',
    true
  ),
  (
    'user@satubencana.id',
    crypt('admin123', gen_salt('bf')),
    'user',
    'User',
    true
  )
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  display_name = EXCLUDED.display_name,
  active = EXCLUDED.active,
  updated_at = now();
