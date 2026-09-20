import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, authCookieOptions } from '@/lib/auth'
import { loginSchema, firstZodMessage } from '@/lib/validation'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    // Anti-fuerza-bruta: 10 intentos / 15 min por IP (mitigación básica)
    const rl = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)
    if (!rl.ok) {
      return Response.json({ error: 'Demasiados intentos. Prueba en unos minutos.' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: firstZodMessage(parsed.error) }, { status: 400 })
    }
    const { email, password } = parsed.data

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

    const res = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: realClientId,
      },
    })
    // Cookie httpOnly: el navegador la envía sola; el token en el body se
    // mantiene por compatibilidad con sesiones ya guardadas en localStorage.
    res.cookies.set('at-token', token, authCookieOptions())
    return res
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
