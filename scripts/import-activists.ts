import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface ActivistData {
  name: string
  country: string
  vessel: string
  notes?: string
  refs: string[]
  status: string | null
  has_video: boolean
  country_code?: string
}

async function main() {
  console.log('🚀 Starting activist data import...')

  try {
    // First, ensure missions exist
    console.log('🎯 Setting up missions...')
    await prisma.$executeRaw`
      INSERT INTO missions (id, name, description, created_at, updated_at) 
      VALUES 
        (gen_random_uuid()::text, 'Sumud Flotilla', 'The Sumud Flotilla mission to Gaza', NOW(), NOW()),
        (gen_random_uuid()::text, 'Thousands Medleens', 'The Thousands Medleens mission', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `

    // Get the Sumud Flotilla mission ID
    const sumudFlotilla = await prisma.$queryRaw`
      SELECT id FROM missions WHERE name = 'Sumud Flotilla' LIMIT 1;
    ` as any[]

    const sumudFlotillaId = sumudFlotilla[0]?.id

    if (!sumudFlotillaId) {
      throw new Error('Failed to get Sumud Flotilla mission ID')
    }

    console.log('✅ Missions ready')

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'activists_merged.json')
    const jsonData = fs.readFileSync(jsonPath, 'utf8')
    const activists: ActivistData[] = JSON.parse(jsonData)

    console.log(`📊 Found ${activists.length} activists to import`)

    // Check if we should clear existing data or update
    const shouldClear = process.argv.includes('--clear')
    
    if (shouldClear) {
      console.log('🗑️  Clearing existing activist data...')
      await prisma.timelineEvent.deleteMany()
      await prisma.submission.deleteMany()
      await prisma.activist.deleteMany()
      console.log('✅ Existing data cleared')
    } else {
      console.log('🔄 Update mode: Will update existing activists and add new ones')
    }

    // Process activists in batches to avoid memory issues
    const batchSize = 100
    let imported = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < activists.length; i += batchSize) {
      const batch = activists.slice(i, i + batchSize)
      
      const activistsToProcess = batch
        .map(activist => {
          // Map JSON fields to database schema, handling null values
          const name = (activist.name || '').trim()
          const nationality = (activist.country || '').trim()
          const boatName = (activist.vessel || '').trim()
          
          // Skip activists with empty names
          if (!name) {
            return null
          }
          
          return {
            name,
            nationality: nationality || 'Unknown',
            boatName: boatName || 'Unknown',
            status: activist.status || 'unknown', // Default to 'unknown' if status is null
            videoUrl: activist.has_video ? 'Video available' : null, // Simple flag for now
            missionId: sumudFlotillaId, // Assign all to Sumud Flotilla for now
            // Store additional info in a way that could be used later
            // You could create a separate table for notes/refs if needed
          }
        })
        .filter(activist => activist !== null) // Remove null entries

      if (shouldClear) {
        // Create activists in batch (original behavior)
        const created = await prisma.activist.createMany({
          data: activistsToProcess,
          skipDuplicates: true // Skip if name already exists
        })
        imported += created.count
      } else {
        // Update mode: upsert each activist using raw SQL
        for (const activistData of activistsToProcess) {
          try {
            const result = await prisma.$executeRaw`
              INSERT INTO activists (id, name, nationality, boat_name, status, video_url, mission_id, created_at, updated_at)
              VALUES (gen_random_uuid()::text, ${activistData.name}, ${activistData.nationality}, ${activistData.boatName}, ${activistData.status}, ${activistData.videoUrl}, ${activistData.missionId}, NOW(), NOW())
              RETURNING id, created_at;
            `
            
            // Since we're just inserting (no conflicts), this is always a new record
            imported++
          } catch (error) {
            console.error(`Error processing activist ${activistData.name}:`, error)
            skipped++
          }
        }
      }

      const skippedInBatch = batch.length - activistsToProcess.length
      skipped += skippedInBatch
      
      if (shouldClear) {
        console.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activists.length / batchSize)} - ${imported} imported, ${skippedInBatch} skipped (empty names)`)
      } else {
        console.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activists.length / batchSize)} - ${imported} created, ${updated} updated, ${skippedInBatch} skipped (empty names)`)
      }
    }

    console.log(`\n✅ Import completed successfully!`)
    if (shouldClear) {
      console.log(`📈 Total imported: ${imported} activists`)
      console.log(`⏭️  Skipped (empty names/duplicates): ${skipped} activists`)
    } else {
      console.log(`📈 Total created: ${imported} activists`)
      console.log(`🔄 Total updated: ${updated} activists`)
      console.log(`⏭️  Skipped (empty names/errors): ${skipped} activists`)
    }

    // Show some statistics
    const totalInDb = await prisma.activist.count()
    const statusCounts = await prisma.activist.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log(`\n📊 Database Statistics:`)
    console.log(`   Total activists in database: ${totalInDb}`)
    console.log(`   Status breakdown:`)
    statusCounts.forEach(status => {
      console.log(`     ${status.status}: ${status._count.status}`)
    })

  } catch (error) {
    console.error('❌ Import failed:', error)
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
