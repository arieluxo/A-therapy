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
    const templates = searchParams.get('templates') === 'true'

    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where = templates
      ? { isTemplate: true }
      : clientId
        ? { clientId, isTemplate: false }
        : { clientId: null, isTemplate: false }

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
    const { name, clientId, mesocycle, week, days, isTemplate, templateId } = body

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    let sourceDays = days ?? []

    // Si viene templateId, clonar días de la plantilla
    if (templateId && !days) {
      const template = await db.training.findUnique({
        where: { id: templateId },
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
      if (!template || !template.isTemplate) {
        return Response.json({ error: 'Plantilla no encontrada' }, { status: 404 })
      }
      if (auth.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (!clientId) {
        return Response.json({ error: 'clientId is required' }, { status: 400 })
      }
      sourceDays = template.days.map((day) => ({
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        exercises: day.exercises.map((ex) => ({
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
      }))
    } else if (isTemplate) {
      if (auth.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      // plantilla: sin clientId, isTemplate = true
      const training = await db.training.create({
        data: {
          name,
          clientId: null,
          isTemplate: true,
          mesocycle: mesocycle ?? undefined,
          week: week ?? undefined,
          days: {
            create: (sourceDays ?? []).map((day: {
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
    } else {
      // entrenamiento normal: requiere clientId
      if (auth.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (!clientId) {
        return Response.json({ error: 'clientId is required' }, { status: 400 })
      }
    }

    const training = await db.training.create({
      data: {
        name,
        clientId,
        mesocycle: mesocycle ?? undefined,
        week: week ?? undefined,
        days: {
          create: (sourceDays ?? []).map((day: {
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
