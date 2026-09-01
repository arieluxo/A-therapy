import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const muscleGroup = searchParams.get('muscleGroup') || ''

    const where = muscleGroup
      ? { muscleGroup }
      : {}

    const exercises = await db.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return Response.json({ exercises })
  } catch (error) {
    console.error('GET exercises error:', error)
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
    const { name, muscleGroup, equipment, technique, videoUrl, notes } = body

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const exercise = await db.exercise.create({
      data: {
        name,
        muscleGroup: muscleGroup ?? undefined,
        equipment: equipment ?? undefined,
        technique: technique ?? undefined,
        videoUrl: videoUrl ?? undefined,
        notes: notes ?? undefined,
      },
    })

    return Response.json({ exercise }, { status: 201 })
  } catch (error) {
    console.error('POST exercises error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
