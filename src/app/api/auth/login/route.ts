import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return Response.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        client: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      return Response.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
    }

    if (!user.isActive) {
      return Response.json({ error: 'Cuenta desactivada' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return Response.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
    }

    const realClientId = user.client?.id ?? null

    const token = createToken({
      userId: user.id,
      role: user.role,
      clientId: realClientId ?? undefined,
    })

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: realClientId,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
