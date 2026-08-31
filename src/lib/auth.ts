import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'a-therapy-secret-key-change-in-production'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(payload: { userId: string; role: string; clientId?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; role: string; clientId?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; clientId?: string }
  } catch {
    return null
  }
}

export async function getUserFromRequest(req: Request): Promise<{ userId: string; role: string; clientId?: string } | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  return verifyToken(token)
}
