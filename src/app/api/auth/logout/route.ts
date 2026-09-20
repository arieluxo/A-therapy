import { AUTH_COOKIE } from '@/lib/auth'

// Cierra sesión limpiando la cookie httpOnly. El frontend además limpia
// su copia de localStorage.
export async function POST() {
  const res = Response.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
