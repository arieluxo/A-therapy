import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { email, name, role, isActive, password } = body

    const data: Record<string, unknown> = {}
    if (email !== undefined) data.email = email
    if (name !== undefined) data.name = name
    if (role !== undefined) data.role = role
    if (isActive !== undefined) data.isActive = isActive
    if (password) {
      data.passwordHash = await hashPassword(password)
    }

    const user = await db.user.update({
      where: { id },
      data,
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
    })

    return Response.json({ user })
  } catch (error) {
    console.error('PUT user error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // Deactivate instead of deleting
    const user = await db.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        clientId: true,
        isActive: true,
      },
    })

    return Response.json({ user, message: 'User deactivated successfully' })
  } catch (error) {
    console.error('DELETE user error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
