const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function syncStockProgress() {
  try {
    console.log('🔄 Starting stock progress synchronization...\n')
    
    // Get all stocks
    const stocks = await prisma.stock.findMany({
      where: {
        stock_name: '5+1 кальян'
      },
      include: {
        user: true
      }
    })
    
    console.log(`📊 Found ${stocks.length} stocks to check\n`)
    
    let fixed = 0
    let alreadyCorrect = 0
    
    for (const stock of stocks) {
      // Get history for this user
      const history = await prisma.hookahHistory.findMany({
        where: {
          user_id: stock.user_id,
          hookah_type: 'regular'
        }
      })
      
      const expectedProgress = history.length * 20
      const actualProgress = stock.progress
      
      if (expectedProgress !== actualProgress) {
        console.log(`⚠️  Mismatch found for ${stock.user.first_name} ${stock.user.last_name}:`)
        console.log(`   Current progress: ${actualProgress}%`)
        console.log(`   Expected (${history.length} × 20): ${expectedProgress}%`)
        
        // Update the stock
        await prisma.stock.update({
          where: { id: stock.id },
          data: { progress: expectedProgress }
        })
        
        console.log(`   ✅ Fixed! Updated to ${expectedProgress}%\n`)
        fixed++
      } else {
        alreadyCorrect++
      }
    }
    
    console.log('\n📈 Summary:')
    console.log(`   ✅ Already correct: ${alreadyCorrect}`)
    console.log(`   🔧 Fixed: ${fixed}`)
    console.log(`   📊 Total checked: ${stocks.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

syncStockProgress()

