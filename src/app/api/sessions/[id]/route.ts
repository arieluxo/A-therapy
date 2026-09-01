import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

function computeExerciseVolume(sets: Array<{ reps: number | null; weight: number | null }>): number {
  return sets.reduce((sum, set) => sum + (set.reps ?? 0) * (set.weight ?? 0), 0)
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json()
    const { clientId, trainingId, dayNumber, date, notes, rpe, exercises } = body

    // Check ownership
    const existing = await db.session.findUnique({
      where: { id },
      select: { clientId: true },
    })

    if (!existing) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    if (auth.role !== 'admin' && auth.clientId !== existing.clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If exercises are provided, replace all exercises and sets
    if (exercises && Array.isArray(exercises)) {
      // Delete existing session exercises and their sets (cascade)
      await db.sessionExercise.deleteMany({ where: { sessionId: id } })

      const session = await db.session.update({
        where: { id },
        data: {
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
      })
    }

    // Simple field update
    const session = await db.session.update({
      where: { id },
      data: {
        trainingId: trainingId ?? undefined,
        dayNumber: dayNumber ?? undefined,
        date: date ? new Date(date) : undefined,
        notes: notes ?? undefined,
        rpe: rpe ?? undefined,
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
    })
  } catch (error) {
    console.error('PUT session error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const existing = await db.session.findUnique({
      where: { id },
      select: { clientId: true },
    })

    if (!existing) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    if (auth.role !== 'admin' && auth.clientId !== existing.clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.session.delete({
      where: { id },
    })

    return Response.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('DELETE session error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
