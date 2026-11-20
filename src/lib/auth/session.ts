import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAuthSecret, SESSION_COOKIE } from '@/lib/auth/config';

export type AppRole = 'admin' | 'user';

export type SessionPayload = {
  sub: string;
  email: string;
  role: AppRole;
  name?: string;
};

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const role = payload.role === 'admin' || payload.role === 'user' ? payload.role : null;
    if (!sub || !email || !role) return null;
    return {
      sub,
      email,
      role,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export async function readSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions(maxAgeSec = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  };
}
