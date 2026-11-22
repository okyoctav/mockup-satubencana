import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'mdb_session';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/simulasi-modeling',
  '/manajemen-data-bencana',
  '/management',
  '/admin',
  '/api-testing',
];

const ADMIN_ONLY_PREFIXES = ['/admin', '/manajemen-data-bencana', '/management', '/api-testing'];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminOnly(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getAuthMode(): 'local' | 'supabase' {
  const raw = (process.env.AUTH_MODE || '').toLowerCase().trim();
  if (raw === 'local' || raw === 'supabase') return raw;
  if (process.env.DATABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) return 'local';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'supabase';
  }
  return 'local';
}

async function readLocalSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'mdb-dev-secret-change-me',
    );
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role === 'admin' || payload.role === 'user' ? payload.role : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    if (!role || !email) return null;
    return { role, email };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const mode = getAuthMode();

  // Mode supabase: sesi disimpan oleh Supabase SDK di browser (localStorage).
  // Validasi sesi dan hak akses (role) dilakukan di masing-masing page/layout.
  if (mode === 'supabase') {
    return NextResponse.next();
  }

  // Mode local (Postgres)
  const session = await readLocalSession(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminOnly(pathname) && session.role !== 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/dashboard',
    '/simulasi-modeling/:path*',
    '/simulasi-modeling',
    '/manajemen-data-bencana/:path*',
    '/manajemen-data-bencana',
    '/management/:path*',
    '/management',
    '/admin/:path*',
    '/admin',
    '/api-testing/:path*',
    '/api-testing',
  ],
};
