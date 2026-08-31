import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (auth.role !== 'admin' && auth.clientId !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const client = await db.client.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, clientId: true, isActive: true } },
        measurements: { orderBy: { date: 'desc' }, take: 20 },
        trainings: {
          orderBy: { createdAt: 'desc' },
          include: { days: { orderBy: { dayNumber: 'asc' }, include: { exercises: { orderBy: { order: 'asc' } } } } },
        },
        sessions: {
          orderBy: { date: 'desc' },
          include: { exercises: { orderBy: { order: 'asc' }, include: { sets: { orderBy: { setNumber: 'asc' } } } } },
        },
        questionnaires: { orderBy: { date: 'desc' } },
        trainerNotes: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }

    const sessionsWithVolume = client.sessions.map((session) => ({
      ...session,
      exercises: session.exercises.map((ex) => {
        const volume = ex.sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0)
        return { ...ex, volume, sets: ex.sets }
      }),
      totalVolume: session.exercises.reduce((sum, ex) => {
        return sum + ex.sets.reduce((s, set) => s + (set.reps ?? 0) * (set.weight ?? 0), 0)
      }, 0),
    }))

    return Response.json({ ...client, sessions: sessionsWithVolume })
  } catch (error) {
    console.error('GET client error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth || auth.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const body = await req.json()

    if (body.action === 'addNote') {
      await db.trainerNote.create({ data: { clientId: id, content: body.content } })
      return Response.json({ success: true })
    }

    const client = await db.client.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        age: body.age !== undefined ? body.age : undefined,
        height: body.height !== undefined ? body.height : undefined,
        weight: body.weight !== undefined ? body.weight : undefined,
        goal: body.goal ?? undefined,
        experienceLevel: body.experienceLevel ?? undefined,
        injuries: body.injuries ?? undefined,
        weeklyAvailability: body.weeklyAvailability ?? undefined,
        notes: body.notes ?? undefined,
      },
    })
    return Response.json(client)
  } catch (error) {
    console.error('PUT client error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth || auth.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await context.params
    const client = await db.client.findUnique({ where: { id }, select: { userId: true } })
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }
    await db.user.delete({ where: { id: client.userId } })
    return Response.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('DELETE client error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
