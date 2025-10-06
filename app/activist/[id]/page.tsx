import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TimelineView from '@/components/TimelineView'
import Link from 'next/link'
import { colors, cn } from '@/lib/colors'

interface TimelineEvent {
  id: string
  eventDate: Date
  sourceTitle: string
  description: string
  createdAt: Date
}

interface Activist {
  id: string
  name: string
  nationality: string
  boatName: string
  status: string
  createdAt: Date
  updatedAt: Date
  timelineEvents: TimelineEvent[]
}

async function getActivist(id: string): Promise<Activist | null> {
  try {
    const activist = await prisma.activist.findUnique({
      where: { id },
      include: {
        timelineEvents: {
          orderBy: {
            eventDate: 'desc'
          }
        }
      }
    })
    return activist
  } catch (error) {
    console.error('Error fetching activist:', error)
    return null
  }
}

export default async function ActivistProfile({ params }: { params: { id: string } }) {
  const activist = await getActivist(params.id)

  if (!activist) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'detained':
        return 'bg-red-500 text-white border-red-500'
      case 'released':
        return 'bg-green-500 text-white border-green-500'
      case 'missing':
        return 'bg-red-600 text-white border-red-600'
      case 'safe':
        return 'bg-green-600 text-white border-green-600'
      default:
        return 'bg-gray-600 text-white border-gray-600'
    }
  }

  return (
    <div className={cn("relative min-h-screen", colors.background.primary)}>
      {/* Background texture */}
      <div 
        className="fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage: 'url(/Speckles.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Background text with dynamic opacity */}
      <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div 
          className="text-center transition-opacity duration-2000"
          style={{ opacity: 0.05 }}
        >
          <h1 className="text-8xl md:text-9xl font-black text-white leading-tight">
            WE LEAVE
            <br />
            TOGETHER
          </h1>
          <div className="mt-8">
            <h2 className="text-6xl md:text-7xl font-black text-white">
              WE COME BACK
              <br />
              TOGETHER
            </h2>
          </div>
        </div>
      </div>

      <div className="relative z-20 space-y-6 pt-20 pb-8">
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className={cn("transition-colors", colors.link.secondary)}>
                Activists
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className={cn("flex-shrink-0 h-5 w-5", colors.text.muted)} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className={cn("ml-4 text-sm font-medium", colors.text.secondary)}>
                  {activist.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Profile Header */}
        <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border p-6", colors.background.card, colors.border.accent)}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className={cn("text-3xl font-bold mb-2", colors.text.primary)}>
                {activist.name}
              </h1>
              <div className={cn("flex flex-wrap gap-4 text-sm", colors.text.secondary)}>
                <div>
                  <span className={cn("font-medium", colors.text.tertiary)}>Nationality:</span> {activist.nationality}
                </div>
                <div>
                  <span className={cn("font-medium", colors.text.tertiary)}>Boat:</span> {activist.boatName}
                </div>
                <div>
                  <span className={cn("font-medium", colors.text.tertiary)}>Profile Created:</span> {(() => {
                    const date = new Date(activist.createdAt)
                    const year = date.getUTCFullYear()
                    const month = date.getUTCMonth() + 1
                    const day = date.getUTCDate()
                    return `${month}/${day}/${year}`
                  })()}
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border ${getStatusColor(activist.status)}`}>
                {activist.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className={cn("backdrop-blur-sm rounded-lg shadow-2xl border p-6", colors.background.card, colors.border.accent)}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn("text-xl font-semibold", colors.text.primary)}>
              Timeline ({activist.timelineEvents.length} events)
            </h2>
            <Link 
              href={`/submit?activist=${activist.id}`}
              className={cn("font-medium py-2 px-4 rounded-lg transition-colors duration-200", colors.button.secondary)}
            >
              Submit Update
            </Link>
          </div>
        
          {activist.timelineEvents.length > 0 ? (
            <TimelineView events={activist.timelineEvents.map(event => ({
              ...event,
              eventDate: event.eventDate.toISOString(),
              createdAt: event.createdAt.toISOString()
            }))} />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No timeline events yet</h3>
              <p className="text-gray-300 mb-4">
                Be the first to submit information about {activist.name}.
              </p>
              <Link 
                href={`/submit?activist=${activist.id}`}
                className={cn("font-medium py-2 px-4 rounded-lg transition-colors duration-200", colors.button.primary)}
              >
                Submit First Update
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={cn("backdrop-blur-sm rounded-lg p-6 border", colors.background.overlay, colors.border.subtle)}>
          <h3 className={cn("text-lg font-medium mb-2", colors.text.primary)}>
            Have information about {activist.name}?
          </h3>
          <p className={cn("mb-4", colors.text.secondary)}>
            Help keep this timeline updated by submitting new information, updates, or corrections.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href={`/submit?activist=${activist.id}`}
              className={cn("font-medium py-2 px-4 rounded-lg transition-colors duration-200", colors.button.secondary)}
            >
              Submit Update
            </Link>
            <Link 
              href="/"
              className={cn("font-medium py-2 px-4 rounded-lg transition-colors duration-200", colors.button.secondaryOutline)}
            >
              View All Activists
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
