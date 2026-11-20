import { NextResponse } from 'next/server';
import { getAuthMode, SESSION_COOKIE } from '@/lib/auth/config';
import { localQuery } from '@/lib/db/local';
import { signSession, sessionCookieOptions, type AppRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  if (getAuthMode() !== 'local') {
    return NextResponse.json(
      { ok: false, error: 'Endpoint ini hanya untuk AUTH_MODE=local. Pakai Supabase Auth di Vercel.' },
      { status: 400 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Body JSON tidak valid.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email dan password wajib diisi.' }, { status: 400 });
  }

  try {
    const result = await localQuery<{
      id: string;
      email: string;
      role: AppRole;
      display_name: string | null;
    }>(
      `SELECT id::text, email, role::text AS role, display_name
       FROM public.app_users
       WHERE lower(email) = lower($1)
         AND active = true
         AND password_hash = crypt($2, password_hash)
       LIMIT 1`,
      [email, password],
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Email atau password salah.' }, { status: 401 });
    }

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.display_name || undefined,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.display_name,
      },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal login.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
