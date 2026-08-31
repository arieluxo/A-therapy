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

    if (!clientId) {
      return Response.json({ error: 'clientId query parameter is required' }, { status: 400 })
    }

    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const measurements = await db.measurement.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
    })

    return Response.json({ measurements })
  } catch (error) {
    console.error('GET measurements error:', error)
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
    const { clientId, date, weight, chest, waist, hips, arm, thigh, shoulder, calf, notes } = body

    if (!clientId) {
      return Response.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Admin can create for any client; client can create for themselves
    if (auth.role !== 'admin' && auth.clientId !== clientId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const measurement = await db.measurement.create({
      data: {
        clientId,
        date: date ? new Date(date) : undefined,
        weight: weight ?? undefined,
        chest: chest ?? undefined,
        waist: waist ?? undefined,
        hips: hips ?? undefined,
        arm: arm ?? undefined,
        thigh: thigh ?? undefined,
        shoulder: shoulder ?? undefined,
        calf: calf ?? undefined,
        notes: notes ?? undefined,
      },
    })

    return Response.json({ measurement }, { status: 201 })
  } catch (error) {
    console.error('POST measurements error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
