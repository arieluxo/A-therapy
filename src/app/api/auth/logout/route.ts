import { NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'

// Cierra sesión limpiando la cookie httpOnly. El frontend además limpia
// su copia de localStorage.
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
