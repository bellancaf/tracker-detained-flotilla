import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const activists = await prisma.activist.findMany({
      select: {
        id: true,
        name: true,
        nationality: true,
        boatName: true,
        status: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(activists)
  } catch (error) {
    console.error('Error fetching activists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activists' },
      { status: 500 }
    )
  }
}
