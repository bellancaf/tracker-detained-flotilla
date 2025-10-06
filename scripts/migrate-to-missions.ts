import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateToMissions() {
  try {
    console.log('🚀 Starting migration to missions...')

    // Step 1: Create missions table
    console.log('🏗️  Creating missions table...')
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    console.log('✅ Missions table created')

    // Step 2: Create missions
    console.log('🎯 Creating missions...')
    await prisma.$executeRaw`
      INSERT INTO missions (id, name, description) 
      VALUES 
        (gen_random_uuid()::text, 'Sumud Flotilla', 'The Sumud Flotilla mission to Gaza'),
        (gen_random_uuid()::text, 'Thousands Medleens', 'The Thousands Medleens mission')
      ON CONFLICT (name) DO NOTHING;
    `

    // Get the mission IDs
    const missions = await prisma.$queryRaw`
      SELECT id, name FROM missions WHERE name IN ('Sumud Flotilla', 'Thousands Medleens');
    ` as any[]

    const sumudFlotilla = missions.find(m => m.name === 'Sumud Flotilla')
    const thousandsMedleens = missions.find(m => m.name === 'Thousands Medleens')

    console.log('✅ Missions created')

    // Step 3: Add mission_id column with default value
    console.log('🔧 Adding mission_id column...')
    await prisma.$executeRaw`
      ALTER TABLE activists 
      ADD COLUMN IF NOT EXISTS mission_id TEXT;
    `

    // Step 4: Update all existing activists to have a mission
    console.log('📝 Assigning activists to missions...')
    const updateResult = await prisma.$executeRaw`
      UPDATE activists 
      SET mission_id = ${sumudFlotilla.id}
      WHERE mission_id IS NULL;
    `

    console.log(`✅ Updated activists with mission assignment`)

    // Step 5: Make mission_id required
    console.log('🔒 Making mission_id required...')
    await prisma.$executeRaw`
      ALTER TABLE activists 
      ALTER COLUMN mission_id SET NOT NULL;
    `

    // Step 6: Add foreign key constraint
    console.log('🔗 Adding foreign key constraint...')
    try {
      await prisma.$executeRaw`
        ALTER TABLE activists 
        ADD CONSTRAINT activists_mission_id_fkey 
        FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE;
      `
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Foreign key constraint already exists')
      } else {
        throw error
      }
    }

    console.log('✅ Migration completed successfully!')

    // Show statistics
    const totalActivists = await prisma.activist.count()
    const missionStats = await prisma.$queryRaw`
      SELECT m.name, COUNT(a.id) as activist_count
      FROM missions m
      LEFT JOIN activists a ON m.id = a.mission_id
      GROUP BY m.id, m.name
      ORDER BY m.name;
    ` as any[]

    console.log(`\n📊 Migration Results:`)
    console.log(`   Total activists: ${totalActivists}`)
    missionStats.forEach((mission: any) => {
      console.log(`   ${mission.name}: ${mission.activist_count} activists`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateToMissions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
