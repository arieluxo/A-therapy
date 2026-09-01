import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const existingAdmin = await db.user.findFirst({
      where: { role: 'admin' },
    })

    if (existingAdmin) {
      return Response.json({ error: 'Admin user already exists' }, { status: 400 })
    }

    const passwordHash = await hashPassword('admin123')

    const admin = await db.user.create({
      data: {
        email: 'admin@atherapy.com',
        passwordHash,
        name: 'Admin A-THERAPY',
        role: 'admin',
      },
    })

    return Response.json({
      message: 'Admin user seeded successfully',
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
