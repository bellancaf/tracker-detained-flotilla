import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAdminAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { submissionIds, action } = await request.json()

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid submission IDs' }, { status: 400 })
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update all submissions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedSubmissions = []
      
      for (const submissionId of submissionIds) {
        const submission = await tx.submission.update({
          where: { id: submissionId },
          data: {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedAt: new Date()
          }
        })
        updatedSubmissions.push(submission)

        // If approved, create timeline event
        if (action === 'approve' && submission.activistId) {
          await tx.timelineEvent.create({
            data: {
              activistId: submission.activistId,
              eventDate: submission.eventDate,
              sourceTitle: submission.sourceTitle,
              description: submission.description
            }
          })
        }
      }

      return updatedSubmissions
    })

    return NextResponse.json({ 
      message: `Successfully ${action}d ${result.length} submissions`,
      count: result.length 
    })

  } catch (error) {
    console.error('Bulk submission update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
