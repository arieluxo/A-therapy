import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword, createToken } from '@/lib/auth'

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
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ users })
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
    const { email, password, name, role } = body

    if (!email || !password || !name) {
      return Response.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'client',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        isActive: true,
        createdAt: true,
      },
    })

    return Response.json({ user }, { status: 201 })
  } catch (error) {
    console.error('POST users error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
