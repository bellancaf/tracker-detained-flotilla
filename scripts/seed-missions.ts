import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMissions() {
  try {
    console.log('Seeding missions...')

    // Create the two missions
    const sumudFlotilla = await prisma.mission.upsert({
      where: { name: 'Sumud Flotilla' },
      update: {},
      create: {
        name: 'Sumud Flotilla',
        description: 'The Sumud Flotilla mission to Gaza'
      }
    })

    const thousandsMedleens = await prisma.mission.upsert({
      where: { name: 'Thousands Medleens' },
      update: {},
      create: {
        name: 'Thousands Medleens',
        description: 'The Thousands Medleens mission'
      }
    })

    console.log('Missions created:', { sumudFlotilla, thousandsMedleens })

    // Get all existing activists
    const activists = await prisma.activist.findMany()
    console.log(`Found ${activists.length} activists to update`)

    // For now, assign all activists to Sumud Flotilla
    // In a real scenario, you'd need to determine which mission each activist belongs to
    const updateResult = await prisma.activist.updateMany({
      where: {},
      data: {
        missionId: sumudFlotilla.id
      }
    })

    console.log(`Updated ${updateResult.count} activists to Sumud Flotilla mission`)

    console.log('Mission seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding missions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedMissions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
