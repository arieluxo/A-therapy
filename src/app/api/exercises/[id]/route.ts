import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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
    const { name, muscleGroup, equipment, technique, videoUrl, notes } = body

    const exercise = await db.exercise.update({
      where: { id },
      data: {
        name: name ?? undefined,
        muscleGroup: muscleGroup ?? undefined,
        equipment: equipment ?? undefined,
        technique: technique ?? undefined,
        videoUrl: videoUrl ?? undefined,
        notes: notes ?? undefined,
      },
    })

    return Response.json({ exercise })
  } catch (error) {
    console.error('PUT exercise error:', error)
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

    await db.exercise.delete({
      where: { id },
    })

    return Response.json({ message: 'Exercise deleted successfully' })
  } catch (error) {
    console.error('DELETE exercise error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
