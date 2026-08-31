import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

const SCORE_FIELDS = [
  'sleepQuality',
  'fatigue',
  'stress',
  'motivation',
  'pain',
  'energy',
  'hunger',
  'adherence',
  'trainingFeeling',
] as const

function computeOverallScore(data: Record<string, number | null | undefined>): number {
  const values: number[] = []
  for (const field of SCORE_FIELDS) {
    const val = data[field]
    if (val !== null && val !== undefined) {
      values.push(val)
    }
  }
  if (values.length === 0) return 0
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
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

    const questionnaires = await db.questionnaire.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
    })

    return Response.json({ questionnaires })
  } catch (error) {
    console.error('GET questionnaires error:', error)
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
    const { clientId, date, notes, ...scoreData } = body

    if (!clientId) {
      return Response.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Admin can create for any client; client can create for themselves
    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const overallScore = computeOverallScore(scoreData)

    const questionnaire = await db.questionnaire.create({
      data: {
        clientId,
        date: date ? new Date(date) : undefined,
        sleepQuality: scoreData.sleepQuality ?? undefined,
        fatigue: scoreData.fatigue ?? undefined,
        stress: scoreData.stress ?? undefined,
        motivation: scoreData.motivation ?? undefined,
        pain: scoreData.pain ?? undefined,
        energy: scoreData.energy ?? undefined,
        hunger: scoreData.hunger ?? undefined,
        adherence: scoreData.adherence ?? undefined,
        trainingFeeling: scoreData.trainingFeeling ?? undefined,
        overallScore,
        notes: notes ?? undefined,
      },
    })

    return Response.json({ questionnaire }, { status: 201 })
  } catch (error) {
    console.error('POST questionnaires error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
