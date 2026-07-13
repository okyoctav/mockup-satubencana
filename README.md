# DataBencana Admin Dashboard

Aplikasi Next.js untuk dashboard dan manajemen data bencana dengan integrasi Supabase Auth dan ACL.

## Fitur yang tersedia

- Halaman login berbasis Supabase Auth (email/password)
- Proteksi halaman admin melalui session Supabase
- Shell admin Ant Design dengan sidebar dan header
- Halaman management data dan halaman users/roles

## Persiapan lingkungan

Buat file `.env.local` di root proyek dengan variabel berikut:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Menjalankan proyek

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Setup Supabase

1. Buat project Supabase.
2. Jalankan migration di folder `supabase/migrations/0001_init_acl.sql`.
3. Daftarkan akun pengguna melalui Supabase Auth.
4. Pastikan tabel `public.app_users` memiliki row untuk user yang login dan kolom `role` terisi `admin` jika ingin mengakses admin.

## Verifikasi

```bash
npm run lint
npm run build
```
