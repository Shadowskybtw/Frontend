const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugUserData() {
  try {
    // Get user by phone last 4 digits
    const phone = process.argv[2] || '6642'
    console.log('🔍 Searching for user with phone ending in:', phone)
    
    const allUsers = await prisma.user.findMany()
    const user = allUsers.find(u => {
      const phoneDigits = u.phone.replace(/\D/g, '')
      const last4 = phoneDigits.slice(-4)
      return last4 === phone
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('\n👤 User found:')
    console.log('  ID:', user.id)
    console.log('  TG ID:', user.tg_id.toString())
    console.log('  Name:', user.first_name, user.last_name)
    console.log('  Phone:', user.phone)
    
    // Get stocks
    const stocks = await prisma.stock.findMany({
      where: { user_id: user.id }
    })
    
    console.log('\n📊 Stocks:')
    for (const stock of stocks) {
      console.log(`  - ${stock.stock_name}: ${stock.progress}% (completed: ${stock.promotion_completed})`)
    }
    
    // Get hookah history
    const history = await prisma.hookahHistory.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    })
    
    console.log(`\n📜 Hookah History (${history.length} total):`)
    const regular = history.filter(h => h.hookah_type === 'regular')
    const free = history.filter(h => h.hookah_type === 'free')
    
    console.log(`  - Regular: ${regular.length}`)
    console.log(`  - Free: ${free.length}`)
    
    console.log('\n📝 Last 5 records:')
    for (const record of history.slice(0, 5)) {
      console.log(`  - ID ${record.id}: ${record.hookah_type} (${record.created_at})`)
    }
    
    // Calculate what SHOULD be the state
    const expectedProgress = regular.length * 20
    const currentProgress = stocks.find(s => s.stock_name === '5+1 кальян')?.progress || 0
    
    console.log('\n🔍 Analysis:')
    console.log(`  Expected progress (${regular.length} × 20): ${expectedProgress}%`)
    console.log(`  Actual progress in DB: ${currentProgress}%`)
    console.log(`  Match: ${expectedProgress === currentProgress ? '✅' : '❌ MISMATCH!'}`)
    
    if (expectedProgress !== currentProgress) {
      console.log('\n⚠️  WARNING: Progress in stocks table does not match hookah_history!')
      console.log('  This is the root cause of the problem.')
      console.log(`  Should be: ${expectedProgress}%`)
      console.log(`  Currently: ${currentProgress}%`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserData()

