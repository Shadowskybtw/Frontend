const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function rebuildDatabase() {
  try {
    console.log('🔧 Starting database rebuild...\n')
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'rebuild-database-logic.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by statements (simple approach - split by semicolon and filter comments)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)
    
    let executed = 0
    let skipped = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comment blocks
      if (statement.startsWith('/*') || statement.includes('COMMENT')) {
        skipped++
        continue
      }
      
      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)
        await prisma.$executeRawUnsafe(statement + ';')
        executed++
        console.log(`✅ Done`)
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('does not exist')) {
          console.log(`⚠️  Skipped (${error.code})`)
          skipped++
        } else {
          console.error(`❌ Error: ${error.message}`)
          // Don't stop on errors, continue
        }
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Executed: ${executed}`)
    console.log(`   ⚠️  Skipped: ${skipped}`)
    console.log(`   📝 Total: ${statements.length}`)
    
    // Verify the results
    console.log('\n🔍 Verifying results...')
    
    const result = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        s.progress as current_progress,
        (SELECT COUNT(*) FROM hookah_history WHERE user_id = u.id AND hookah_type = 'regular') * 20 as expected_progress
      FROM users u
      JOIN stocks s ON s.user_id = u.id
      WHERE s.stock_name = '5+1 кальян'
      ORDER BY s.progress DESC
      LIMIT 10
    `
    
    console.log('\n📈 Top 10 users by progress:')
    for (const row of result) {
      const match = row.current_progress === Math.min(100, row.expected_progress) ? '✅' : '❌'
      console.log(`   ${match} ${row.first_name} ${row.last_name}: ${row.current_progress}% (expected: ${Math.min(100, row.expected_progress)}%)`)
    }
    
    console.log('\n✅ Database rebuild complete!')
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

rebuildDatabase()

