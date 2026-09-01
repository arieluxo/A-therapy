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

    const training = await db.training.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true },
        },
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
            },
          },
        },
        sessions: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!training) {
      return Response.json({ error: 'Training not found' }, { status: 404 })
    }

    // Client can only view their own trainings
    if (auth.role !== 'admin' && auth.clientId !== training.clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for duplicate query param
    const { searchParams } = new URL(req.url)
    const shouldDuplicate = searchParams.get('duplicate') === 'true'

    if (shouldDuplicate) {
      // Clone the training
      const duplicated = await db.training.create({
        data: {
          name: `${training.name} (Copy)`,
          clientId: training.clientId,
          mesocycle: training.mesocycle,
          week: training.week,
          days: {
            create: training.days.map((day) => ({
              dayNumber: day.dayNumber,
              dayName: day.dayName,
              exercises: {
                create: day.exercises.map((ex) => ({
                  exerciseId: ex.exerciseId ?? undefined,
                  exerciseName: ex.exerciseName,
                  order: ex.order,
                  prescribedSets: ex.prescribedSets,
                  prescribedReps: ex.prescribedReps,
                  prescribedRir: ex.prescribedRir,
                  prescribedRpe: ex.prescribedRpe,
                  prescribedRest: ex.prescribedRest,
                  prescribedTempo: ex.prescribedTempo,
                  prescribedWeight: ex.prescribedWeight,
                  notes: ex.notes,
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

      return Response.json({ training: duplicated }, { status: 201 })
    }

    return Response.json({ training })
  } catch (error) {
    console.error('GET training error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const { name, clientId, mesocycle, week, isActive, days } = body

    // If days are provided, we need to replace all days and exercises
    if (days && Array.isArray(days)) {
      // Delete all existing days and their exercises (cascade)
      await db.trainingDay.deleteMany({ where: { trainingId: id } })

      const training = await db.training.update({
        where: { id },
        data: {
          name: name ?? undefined,
          clientId: clientId ?? undefined,
          mesocycle: mesocycle !== undefined ? mesocycle : undefined,
          week: week !== undefined ? week : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          days: {
            create: days.map((day: {
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

      return Response.json({ training })
    }

    // Simple field update without touching days
    const training = await db.training.update({
      where: { id },
      data: {
        name: name ?? undefined,
        clientId: clientId ?? undefined,
        mesocycle: mesocycle !== undefined ? mesocycle : undefined,
        week: week !== undefined ? week : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
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

    return Response.json({ training })
  } catch (error) {
    console.error('PUT training error:', error)
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

    await db.training.delete({
      where: { id },
    })

    return Response.json({ message: 'Training deleted successfully' })
  } catch (error) {
    console.error('DELETE training error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
