import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { userCreateSchema, firstZodMessage } from '@/lib/validation'

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(users)
  } catch (error) {
    console.error('GET users error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = userCreateSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: firstZodMessage(parsed.error) }, { status: 400 })
    }
    const { email, password, name, role } = parsed.data

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return Response.json({ error: 'El email ya está en uso' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const userRole = role || 'client'

    if (userRole === 'client') {
      const user = await db.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'client',
          client: {
            create: { name },
          },
        },
        include: { client: { select: { id: true, name: true } } },
      })
      return Response.json(user, { status: 201 })
    }

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        client: { select: { id: true, name: true } },
      },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('POST users error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
