import { NextResponse } from 'next/server';
import { getAuthMode } from '@/lib/auth/config';
import { readSessionFromCookies } from '@/lib/auth/session';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mode = getAuthMode();

  if (mode === 'local') {
    const session = await readSessionFromCookies();
    if (!session) {
      return NextResponse.json({ ok: false, user: null }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      mode,
      user: {
        id: session.sub,
        email: session.email,
        role: session.role,
        name: session.name || null,
      },
    });
  }

  // supabase mode — best-effort via service client + cookie not fully wired here;
  // client pages still use supabase-js session.
  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json({ ok: false, user: null, mode }, { status: 401 });
  }

  return NextResponse.json({
    ok: false,
    mode,
    user: null,
    hint: 'Di mode supabase, sesi dibaca dari client Supabase Auth.',
  });
}
