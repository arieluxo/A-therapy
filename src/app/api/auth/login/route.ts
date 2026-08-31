import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        passwordHash: true,
        isActive: true,
      },
    })

    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = createToken({
      userId: user.id,
      role: user.role,
      clientId: user.clientId ?? undefined,
    })

    const { passwordHash: _, isActive: __, ...safeUser } = user

    return Response.json({ token, user: safeUser })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
