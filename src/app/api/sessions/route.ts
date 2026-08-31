import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function computeExerciseVolume(sets: Array<{ reps: number | null; weight: number | null }>): number {
  return sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0)
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId') || ''

    if (!clientId) {
      return Response.json({ error: 'clientId query parameter is required' }, { status: 400 })
    }

    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sessions = await db.session.findMany({
      where: { clientId },
      include: {
        training: {
          select: { id: true, name: true },
        },
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    const sessionsWithVolume = sessions.map((session) => {
      const exercisesWithVolume = session.exercises.map((ex) => ({
        ...ex,
        volume: computeExerciseVolume(ex.sets),
      }))
      const totalVolume = exercisesWithVolume.reduce((sum, ex) => sum + ex.volume, 0)
      return {
        ...session,
        exercises: exercisesWithVolume,
        totalVolume,
      }
    })

    return Response.json({ sessions: sessionsWithVolume })
  } catch (error) {
    console.error('GET sessions error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, trainingId, dayNumber, date, notes, rpe, exercises } = body

    if (!clientId || !exercises || !Array.isArray(exercises)) {
      return Response.json({ error: 'clientId and exercises are required' }, { status: 400 })
    }

    // Admin can create for any client; client can create for themselves
    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const session = await db.session.create({
      data: {
        clientId,
        trainingId: trainingId ?? undefined,
        dayNumber: dayNumber ?? undefined,
        date: date ? new Date(date) : undefined,
        notes: notes ?? undefined,
        rpe: rpe ?? undefined,
        exercises: {
          create: exercises.map((ex: {
            exerciseName: string
            order?: number
            sets: Array<{
              setNumber: number
              reps?: number
              weight?: number
              rir?: number
              rpe?: number
            }>
          }) => ({
            exerciseName: ex.exerciseName,
            order: ex.order ?? 0,
            sets: {
              create: (ex.sets ?? []).map((set) => ({
                setNumber: set.setNumber,
                reps: set.reps ?? undefined,
                weight: set.weight ?? undefined,
                rir: set.rir ?? undefined,
                rpe: set.rpe ?? undefined,
              })),
            },
          })),
        },
      },
      include: {
        training: {
          select: { id: true, name: true },
        },
        exercises: {
          orderBy: { order: 'asc' },
          include: {
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })

    // Compute volume
    const exercisesWithVolume = session.exercises.map((ex) => ({
      ...ex,
      volume: computeExerciseVolume(ex.sets),
    }))
    const totalVolume = exercisesWithVolume.reduce((sum, ex) => sum + ex.volume, 0)

    return Response.json({
      session: {
        ...session,
        exercises: exercisesWithVolume,
        totalVolume,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST sessions error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
