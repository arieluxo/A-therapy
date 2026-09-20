import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const AUTH_COOKIE = 'at-token'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET no configurado en producción')
    }
    return 'a-therapy-dev-secret-no-usar-en-produccion'
  }
  return secret
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(payload: { userId: string; role: string; clientId?: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string; clientId?: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; role: string; clientId?: string }
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: Request): string | null {
  // 1) Cookie httpOnly (preferida: no accesible desde JS → resiste XSS)
  const cookieHeader = req.headers.get('cookie') ?? ''
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${AUTH_COOKIE}=`))
  if (match) return decodeURIComponent(match.slice(AUTH_COOKIE.length + 1))
  // 2) Compatibilidad: cabecera Authorization Bearer (clientes antiguos)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  return null
}

export async function getUserFromRequest(req: Request): Promise<{ userId: string; role: string; clientId?: string } | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null
  return verifyToken(token)
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días, igual que el JWT
  }
}
