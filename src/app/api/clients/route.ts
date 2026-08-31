import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hashPassword, createToken } from '@/lib/auth'

function computeClientStatus(
  latestQuestionnaire: { overallScore: number | null } | null,
  lastSession: { date: Date } | null
): string {
  const now = new Date()
  const score = latestQuestionnaire?.overallScore
  const daysSinceSession = lastSession
    ? Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
    : null

  if (score !== null && score >= 70 && daysSinceSession !== null && daysSinceSession <= 7) {
    return 'green'
  }
  if (
    (score !== null && score >= 40 && score < 70) ||
    (daysSinceSession !== null && daysSinceSession > 7 && daysSinceSession <= 14)
  ) {
    return 'yellow'
  }
  return 'red'
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req)
    if (!auth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (auth.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { user: { email: { contains: search } } },
          ],
        }
      : {}

    const clients = await db.client.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, role: true, clientId: true, isActive: true },
        },
        _count: {
          select: { trainings: true, sessions: true, measurements: true, questionnaires: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const clientsWithStatus = await Promise.all(
      clients.map(async (client) => {
        const latestQuestionnaire = await db.questionnaire.findFirst({
          where: { clientId: client.id },
          orderBy: { date: 'desc' },
          select: { overallScore: true },
        })

        const lastSession = await db.session.findFirst({
          where: { clientId: client.id },
          orderBy: { date: 'desc' },
          select: { date: true },
        })

        return {
          ...client,
          latestQuestionnaire,
          lastSession,
          status: computeClientStatus(latestQuestionnaire, lastSession),
        }
      })
    )

    return Response.json(clientsWithStatus)
  } catch (error) {
    console.error('GET clients error:', error)
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
    const { name, email, password, age, height, weight, goal, experienceLevel, injuries, weeklyAvailability, notes } = body

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'client',
        clientId,
        client: {
          create: {
            name,
            age: age ?? undefined,
            height: height ?? undefined,
            weight: weight ?? undefined,
            goal: goal ?? undefined,
            experienceLevel: experienceLevel ?? undefined,
            injuries: injuries ?? undefined,
            weeklyAvailability: weeklyAvailability ?? undefined,
            notes: notes ?? undefined,
          },
        },
      },
    })

    const token = createToken({
      userId: user.id,
      role: user.role,
      clientId: user.clientId ?? undefined,
    })

    return Response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST clients error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
