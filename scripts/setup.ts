import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up database...')

  // This will create the database tables if they don't exist
  // The actual schema is defined in prisma/schema.prisma
  
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Check if we have any activists
    const activistCount = await prisma.activist.count()
    console.log(`📊 Found ${activistCount} activists in database`)
    
    if (activistCount === 0) {
      console.log('🌱 No data found. Run "npm run seed" to add sample data.')
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
