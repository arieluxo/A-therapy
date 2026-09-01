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
    const clientId = searchParams.get('clientId') || ''

    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where = clientId ? { clientId } : {}

    const trainings = await db.training.findMany({
      where,
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ trainings })
  } catch (error) {
    console.error('GET trainings error:', error)
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
    const { name, clientId, mesocycle, week, days } = body

    if (!name || !clientId) {
      return Response.json({ error: 'Name and clientId are required' }, { status: 400 })
    }

    const training = await db.training.create({
      data: {
        name,
        clientId,
        mesocycle: mesocycle ?? undefined,
        week: week ?? undefined,
        days: {
          create: (days ?? []).map((day: {
            dayNumber: number
            dayName?: string
            exercises: Array<{
              exerciseId?: string
              exerciseName: string
              order: number
              prescribedSets?: number
              prescribedReps?: string
              prescribedRir?: string
              prescribedRpe?: number
              prescribedRest?: number
              prescribedTempo?: string
              prescribedWeight?: number
              notes?: string
            }>
          }) => ({
            dayNumber: day.dayNumber,
            dayName: day.dayName ?? undefined,
            exercises: {
              create: (day.exercises ?? []).map((ex) => ({
                exerciseId: ex.exerciseId ?? undefined,
                exerciseName: ex.exerciseName,
                order: ex.order ?? 0,
                prescribedSets: ex.prescribedSets ?? undefined,
                prescribedReps: ex.prescribedReps ?? undefined,
                prescribedRir: ex.prescribedRir ?? undefined,
                prescribedRpe: ex.prescribedRpe ?? undefined,
                prescribedRest: ex.prescribedRest ?? undefined,
                prescribedTempo: ex.prescribedTempo ?? undefined,
                prescribedWeight: ex.prescribedWeight ?? undefined,
                notes: ex.notes ?? undefined,
              })),
            },
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return Response.json({ training }, { status: 201 })
  } catch (error) {
    console.error('POST trainings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
