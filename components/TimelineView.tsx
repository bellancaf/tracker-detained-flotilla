'use client'

import { useState } from 'react'
import { colors, cn } from '@/lib/colors'

interface TimelineEvent {
  id: string
  eventDate: string
  sourceTitle: string
  description: string
  createdAt: string
}

interface TimelineViewProps {
  events: TimelineEvent[]
}

export default function TimelineView({ events }: TimelineViewProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.eventDate)
    const dateB = new Date(b.eventDate)
    return sortOrder === 'newest' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Use UTC to ensure consistent formatting between server and client
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    
    return {
      date: `${monthNames[month]} ${day}, ${year}`,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    // Use UTC to ensure consistent calculation between server and client
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={cn("text-sm", colors.text.secondary)}>Sort by:</span>
          <button
            onClick={() => setSortOrder('newest')}
            className={cn("px-3 py-1 text-sm rounded-md transition-colors", 
              sortOrder === 'newest'
                ? colors.button.primary
                : cn(colors.text.secondary, "hover:bg-neutral-800")
            )}
          >
            Newest First
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            className={cn("px-3 py-1 text-sm rounded-md transition-colors", 
              sortOrder === 'oldest'
                ? colors.button.primary
                : cn(colors.text.secondary, "hover:bg-neutral-800")
            )}
          >
            Oldest First
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className={cn("absolute left-4 top-0 bottom-0 w-0.5", colors.border.secondary)}></div>
        
        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const { date, time } = formatDate(event.eventDate)
            const relativeTime = getRelativeTime(event.eventDate)
            
            return (
              <div key={event.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                
                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className={cn("border rounded-lg p-4 shadow-sm", colors.background.tertiary, colors.border.primary)}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h3 className={cn("text-lg font-semibold", colors.text.primary)}>
                        {event.sourceTitle}
                      </h3>
                      <div className={cn("flex flex-col sm:items-end text-sm mt-1 sm:mt-0", colors.text.tertiary)}>
                        <span className="font-medium">{date}</span>
                        <span>{time} • {relativeTime}</span>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className={cn("leading-relaxed", colors.text.secondary)}>
                        {event.description}
                      </p>
                    </div>
                    
                    <div className={cn("mt-3 pt-3 border-t", colors.border.primary)}>
                      <span className={cn("text-xs", colors.text.muted)}>
                        Added to timeline: {(() => {
                          const date = new Date(event.createdAt)
                          const year = date.getUTCFullYear()
                          const month = date.getUTCMonth() + 1
                          const day = date.getUTCDate()
                          return `${month}/${day}/${year}`
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <div className={cn("mb-2", colors.text.tertiary)}>
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className={cn("text-lg font-medium mb-2", colors.text.primary)}>No timeline events</h3>
          <p className={cn(colors.text.secondary)}>
            Timeline events will appear here as they are added.
          </p>
        </div>
      )}
    </div>
  )
}
