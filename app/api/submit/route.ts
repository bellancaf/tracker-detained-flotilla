import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimit(request, 5, 300000) // 5 requests per 5 minutes
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { activistId, eventDate, sourceTitle, description, submitterEmail, sourceUrl, submissionType } = body

    // Validation based on submission type
    if (submissionType === 'general') {
      if (!sourceTitle || !description || !submitterEmail || !sourceUrl) {
        return NextResponse.json(
          { message: 'All fields are required for general news submissions' },
          { status: 400 }
        )
      }
    } else {
      if (!activistId || !eventDate || !sourceTitle || !description || !submitterEmail) {
        return NextResponse.json(
          { message: 'All fields are required for activist submissions' },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(submitterEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate date for activist submissions
    if (submissionType === 'activist') {
      const eventDateObj = new Date(eventDate)
      if (isNaN(eventDateObj.getTime())) {
        return NextResponse.json(
          { message: 'Invalid date format' },
          { status: 400 }
        )
      }

      // Check if activist exists
      const activist = await prisma.activist.findUnique({
        where: { id: activistId }
      })

      if (!activist) {
        return NextResponse.json(
          { message: 'Activist not found' },
          { status: 404 }
        )
      }
    }

    // Create submission based on type
    let submission
    if (submissionType === 'general') {
      // Create general news submission
      submission = await prisma.generalNews.create({
        data: {
          title: sourceTitle.trim().substring(0, 200),
          description: description.trim().substring(0, 2000),
          sourceUrl: sourceUrl.trim(),
          submitterEmail: submitterEmail.trim().toLowerCase()
        }
      })
    } else {
      // Create activist submission
      const eventDateObj = new Date(eventDate)
      submission = await prisma.submission.create({
        data: {
          activistId,
          eventDate: eventDateObj,
          sourceTitle: sourceTitle.trim().substring(0, 200),
          description: description.trim().substring(0, 2000),
          submitterEmail: submitterEmail.trim().toLowerCase()
        }
      })
    }

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to submitter

    return NextResponse.json({
      message: 'Submission received successfully',
      submissionId: submission.id
    })

  } catch (error) {
    console.error('Error creating submission:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
