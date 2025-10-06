import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    // Build where clause based on filter
    let whereClause = {}
    if (filter !== 'all') {
      whereClause = { status: filter }
    }

    // Fetch activists with timeline event count
    const activists = await prisma.activist.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            timelineEvents: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(activists)
  } catch (error) {
    console.error('Error fetching activists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activistId, updates } = body

    if (!activistId) {
      return NextResponse.json({ error: 'Activist ID is required' }, { status: 400 })
    }

    // Validate required fields
    const { name, nationality, boatName, status } = updates
    if (!name || !nationality || !boatName || !status) {
      return NextResponse.json({ error: 'Name, nationality, boat name, and status are required' }, { status: 400 })
    }

    // Update the activist
    const updatedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: {
        name: name.trim(),
        nationality: nationality.trim(),
        boatName: boatName.trim(),
        status: status.trim(),
        videoUrl: updates.videoUrl?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            timelineEvents: true
          }
        }
      }
    })

    return NextResponse.json(updatedActivist)
  } catch (error) {
    console.error('Error updating activist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activistId = searchParams.get('id')

    if (!activistId) {
      return NextResponse.json({ error: 'Activist ID is required' }, { status: 400 })
    }

    // Delete the activist (this will cascade delete timeline events and submissions)
    await prisma.activist.delete({
      where: { id: activistId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
