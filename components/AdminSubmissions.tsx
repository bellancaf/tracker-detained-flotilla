'use client'

import { useState } from 'react'
import { colors, cn } from '@/lib/colors'

interface Submission {
  id: string
  activistId: string | null
  eventDate: string
  sourceTitle: string
  description: string
  submitterEmail: string
  status: string
  createdAt: string
  reviewedAt: string | null
  activist: {
    id: string
    name: string
    nationality: string
    boatName: string
  } | null
}

interface AdminSubmissionsProps {
  submissions: Submission[]
  onAction: (submissionId: string, action: 'approve' | 'reject') => void
  filter: 'all' | 'pending' | 'approved' | 'rejected'
}

export default function AdminSubmissions({ submissions, onAction, filter }: AdminSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white'
      case 'approved':
        return 'bg-green-500 text-white'
      case 'rejected':
        return 'bg-red-500 text-white'
      default:
        return 'bg-neutral-600 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Use UTC to ensure consistent formatting between server and client
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    
    return `${monthNames[month]} ${day}, ${year} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter)

  return (
    <div className="space-y-4">
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-8">
          <div className={cn("mb-2", colors.text.tertiary)}>
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className={cn("text-lg font-medium mb-2", colors.text.primary)}>
            No {filter === 'all' ? '' : filter} submissions
          </h3>
          <p className={cn(colors.text.secondary)}>
            {filter === 'pending' 
              ? 'All submissions have been reviewed.'
              : 'No submissions match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className={cn("rounded-lg shadow-sm border p-6", colors.background.card, colors.border.accent)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className={cn("text-lg font-semibold", colors.text.primary)}>
                      {submission.sourceTitle}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className={cn("text-sm", colors.text.secondary)}>
                        <span className={cn("font-medium", colors.text.tertiary)}>Activist:</span>{' '}
                        {submission.activist ? (
                          <a 
                            href={`/activist/${submission.activist.id}`}
                            className={cn("transition-colors", colors.link.primary)}
                          >
                            {submission.activist.name}
                          </a>
                        ) : (
                          <span className={colors.text.muted}>Unknown/New Activist</span>
                        )}
                      </p>
                      <p className={cn("text-sm", colors.text.secondary)}>
                        <span className={cn("font-medium", colors.text.tertiary)}>Event Date:</span>{' '}
                        {new Date(submission.eventDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-sm", colors.text.secondary)}>
                        <span className={cn("font-medium", colors.text.tertiary)}>Submitted:</span>{' '}
                        {formatDate(submission.createdAt)}
                      </p>
                      <p className={cn("text-sm", colors.text.secondary)}>
                        <span className={cn("font-medium", colors.text.tertiary)}>Submitter:</span>{' '}
                        {submission.submitterEmail}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className={cn("text-sm font-medium mb-1", colors.text.primary)}>Description:</p>
                    <p className={cn("text-sm p-3 rounded-md", colors.text.secondary, colors.background.tertiary)}>
                      {submission.description}
                    </p>
                  </div>

                  {submission.activist && (
                    <div className={cn("text-sm mb-4", colors.text.secondary)}>
                      <p>
                        <span className={cn("font-medium", colors.text.tertiary)}>Boat:</span> {submission.activist.boatName} • 
                        <span className={cn("font-medium ml-2", colors.text.tertiary)}>Nationality:</span> {submission.activist.nationality}
                      </p>
                    </div>
                  )}
                </div>

                {submission.status === 'pending' && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => onAction(submission.id, 'approve')}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", colors.button.primary)}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onAction(submission.id, 'reject')}
                      className={cn("px-4 py-2 text-sm font-medium rounded-md transition-colors", colors.button.danger)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {submission.reviewedAt && (
                <div className={cn("mt-4 pt-4 border-t", colors.border.primary)}>
                  <p className={cn("text-xs", colors.text.muted)}>
                    Reviewed on: {formatDate(submission.reviewedAt)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
