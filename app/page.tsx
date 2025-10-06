import { Suspense } from 'react'
import HomePageWrapper from '@/components/HomePageWrapper'
import { prisma } from '@/lib/prisma'

async function getActivists() {
  try {
    const activists = await prisma.activist.findMany({
      include: {
        timelineEvents: {
          orderBy: {
            eventDate: 'desc'
          },
          take: 1
        },
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
    // Add missionId to each activist and convert dates to strings
    return activists.map(activist => ({
      ...activist,
      missionId: (activist as any).missionId || '',
      createdAt: activist.createdAt.toISOString(),
      updatedAt: activist.updatedAt.toISOString(),
      timelineEvents: activist.timelineEvents.map(event => ({
        ...event,
        eventDate: event.eventDate.toISOString(),
        createdAt: event.createdAt.toISOString()
      }))
    }))
  } catch (error) {
    console.error('Error fetching activists:', error)
    return []
  }
}

async function getMissions() {
  try {
    // Use raw SQL since Prisma client doesn't have Mission model yet
    const missions = await prisma.$queryRaw`
      SELECT 
        m.id,
        m.name,
        m.description,
        COUNT(a.id) as total_activists,
        a.status,
        COUNT(a.id) FILTER (WHERE a.status IS NOT NULL) as status_count
      FROM missions m
      LEFT JOIN activists a ON m.id = a.mission_id
      GROUP BY m.id, m.name, m.description, a.status
      ORDER BY m.name, a.status;
    ` as any[]

    // Group by mission and calculate stats
    const missionMap = new Map()
    
    missions.forEach((row: any) => {
      if (!missionMap.has(row.id)) {
        missionMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          stats: {
            totalActivists: 0,
            statusBreakdown: {}
          }
        })
      }
      
      const mission = missionMap.get(row.id)
      mission.stats.totalActivists = parseInt(row.total_activists) || 0
      
      if (row.status && row.status_count > 0) {
        mission.stats.statusBreakdown[row.status] = parseInt(row.status_count)
      }
    })

    return Array.from(missionMap.values())
  } catch (error) {
    console.error('Error fetching missions:', error)
    return []
  }
}

export default async function HomePage() {
  const [activists, missions] = await Promise.all([
    getActivists(),
    getMissions()
  ])

  return <HomePageWrapper activists={activists} missions={missions} />
}
