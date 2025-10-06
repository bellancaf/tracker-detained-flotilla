import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a sample mission first
  const mission = await prisma.mission.create({
    data: {
      name: 'Global Sumud Flotilla',
      description: 'International solidarity mission to support Palestinian rights'
    }
  })

  console.log(`Created mission: ${mission.name}`)

  // Create sample activists
  const activists = await Promise.all([
    prisma.activist.create({
      data: {
        name: 'Ahmed Hassan',
        nationality: 'Palestinian',
        boatName: 'Sumud',
        status: 'detained',
        missionId: mission.id
      }
    }),
    prisma.activist.create({
      data: {
        name: 'Maria Rodriguez',
        nationality: 'Spanish',
        boatName: 'Freedom',
        status: 'released',
        missionId: mission.id
      }
    }),
    prisma.activist.create({
      data: {
        name: 'John Smith',
        nationality: 'American',
        boatName: 'Hope',
        status: 'missing',
        missionId: mission.id
      }
    }),
    prisma.activist.create({
      data: {
        name: 'Fatima Al-Zahra',
        nationality: 'Lebanese',
        boatName: 'Sumud',
        status: 'safe',
        missionId: mission.id
      }
    })
  ])

  console.log(`Created ${activists.length} activists`)

  // Create sample timeline events
  const timelineEvents = await Promise.all([
    prisma.timelineEvent.create({
      data: {
        activistId: activists[0].id,
        eventDate: new Date('2024-01-15'),
        sourceTitle: 'Arrest reported by family',
        description: 'Ahmed was arrested during a peaceful demonstration. Family members confirmed the arrest through official channels.'
      }
    }),
    prisma.timelineEvent.create({
      data: {
        activistId: activists[0].id,
        eventDate: new Date('2024-01-16'),
        sourceTitle: 'Court hearing scheduled',
        description: 'First court hearing scheduled for January 20th. Legal representation has been arranged.'
      }
    }),
    prisma.timelineEvent.create({
      data: {
        activistId: activists[1].id,
        eventDate: new Date('2024-01-10'),
        sourceTitle: 'Released from detention',
        description: 'Maria was released after 48 hours of detention. She is now safe and in contact with her family.'
      }
    }),
    prisma.timelineEvent.create({
      data: {
        activistId: activists[2].id,
        eventDate: new Date('2024-01-12'),
        sourceTitle: 'Last known location',
        description: 'John was last seen at the port before the flotilla departure. No contact since then.'
      }
    }),
    prisma.timelineEvent.create({
      data: {
        activistId: activists[3].id,
        eventDate: new Date('2024-01-14'),
        sourceTitle: 'Safe arrival confirmed',
        description: 'Fatima has safely arrived at her destination and is in good health.'
      }
    })
  ])

  console.log(`Created ${timelineEvents.length} timeline events`)

  // Create sample submissions
  const submissions = await Promise.all([
    prisma.submission.create({
      data: {
        activistId: activists[0].id,
        eventDate: new Date('2024-01-18'),
        sourceTitle: 'Update from legal team',
        description: 'Legal team reports that Ahmed is being held in good conditions and has access to legal counsel.',
        submitterEmail: 'lawyer@example.com',
        status: 'pending'
      }
    }),
    prisma.submission.create({
      data: {
        activistId: activists[2].id,
        eventDate: new Date('2024-01-17'),
        sourceTitle: 'Possible sighting reported',
        description: 'A witness reported seeing someone matching John\'s description at a local hospital.',
        submitterEmail: 'witness@example.com',
        status: 'pending'
      }
    })
  ])

  console.log(`Created ${submissions.length} submissions`)

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
