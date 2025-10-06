import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Check admin authentication
  if (!verifyAdminAuth(request)) {
    return new NextResponse('Unauthorized', { 
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"'
      }
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'pending'

    const whereClause = filter === 'all' ? {} : { status: filter }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        activist: {
          select: {
            id: true,
            name: true,
            nationality: true,
            boatName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  // Check admin authentication
  if (!verifyAdminAuth(request)) {
    return new NextResponse('Unauthorized', { 
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Area"'
      }
    })
  }

  try {
    const body = await request.json()
    const { submissionId, action } = body

    if (!submissionId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    // Get the submission first
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { activist: true }
    })

    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { message: 'Submission has already been reviewed' },
        { status: 400 }
      )
    }

    // Update submission status
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date()
      }
    })

    // If approved, create timeline event
    if (action === 'approve' && submission.activistId) {
      await prisma.timelineEvent.create({
        data: {
          activistId: submission.activistId,
          eventDate: submission.eventDate,
          sourceTitle: submission.sourceTitle,
          description: submission.description
        }
      })
    }

    // TODO: Send email notification to submitter

    return NextResponse.json({
      message: `Submission ${action}d successfully`,
      submission: updatedSubmission
    })

  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
