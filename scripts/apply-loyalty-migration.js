const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('📦 Applying loyalty system migration...')
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/001_loyalty_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length > 0) {
        try {
          console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)
          await prisma.$executeRawUnsafe(statement + ';')
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`)
          } else {
            console.error(`❌ Error executing statement ${i + 1}:`, error.message)
            throw error
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!')
    
    // Verify tables exist
    const campaigns = await prisma.$queryRaw`SELECT COUNT(*) as count FROM campaigns`
    const slots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM loyalty_slots`
    const rewards = await prisma.$queryRaw`SELECT COUNT(*) as count FROM rewards`
    const states = await prisma.$queryRaw`SELECT COUNT(*) as count FROM reward_states`
    
    console.log('\n📊 Table counts:')
    console.log(`  - Campaigns: ${campaigns[0].count}`)
    console.log(`  - Loyalty Slots: ${slots[0].count}`)
    console.log(`  - Rewards: ${rewards[0].count}`)
    console.log(`  - Reward States: ${states[0].count}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()

