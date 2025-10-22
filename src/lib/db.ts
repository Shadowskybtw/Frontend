import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Функция для инициализации базы данных
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    return false
  }
}

// Инициализируем базу данных при импорте
initializeDatabase()

// Database types
export interface User {
  id: number
  tg_id: number
  first_name: string
  last_name: string
  phone: string
  username: string | null
  created_at: Date
  updated_at: Date
  is_admin?: boolean
  total_purchases?: number
  total_regular_purchases?: number
  total_free_purchases?: number
}

export interface Stock {
  id: number
  user_id: number
  stock_name: string
  progress: number
  promotion_completed: boolean
  created_at: Date
  updated_at: Date
}

export interface FreeHookah {
  id: number
  user_id: number
  used: boolean
  used_at: Date | null
  created_at: Date
}

export interface HookahHistory {
  id: number
  user_id: number
  hookah_type: string
  slot_number?: number | null
  created_at: Date | null
}

export interface FreeHookahRequest {
  id: number
  user_id: number
  stock_id: number
  status: string
  approved_by?: number | null
  created_at: Date
  updated_at: Date
}

// Database queries
export const db = {
  // Helper to check if database is connected
  isConnected(): boolean {
    try {
      return !!prisma
    } catch (error) {
      console.error('❌ Database connection check failed:', error)
      return false
    }
  },

  // User operations
  async getUserByTgId(tgId: number): Promise<User | null> {
    try {
      console.log('🔍 Getting user by TG ID:', tgId)
      console.log('🔍 Searching for tg_id:', tgId)
      
      const user = await prisma.user.findUnique({
        where: { tg_id: BigInt(tgId) }
      })
      
      console.log('🔍 Raw user from database:', user)
      console.log('🔍 User tg_id type:', typeof user?.tg_id)
      console.log('🔍 User tg_id value:', user?.tg_id)
      
      if (!user) return null
      
      const mappedUser: User = {
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_admin: user.is_admin,
        total_purchases: user.total_purchases,
        total_regular_purchases: user.total_regular_purchases,
        total_free_purchases: user.total_free_purchases
      }
      
      console.log('✅ User found:', mappedUser)
      return mappedUser
    } catch (error) {
      console.error('❌ Error getting user by TG ID:', error)
      return null
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Getting all users')
      const users = await prisma.user.findMany({
        orderBy: { id: 'desc' }
      })
      console.log('Users found:', users.length)
      return users.map(user => ({
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_admin: user.is_admin,
        total_purchases: user.total_purchases,
        total_regular_purchases: user.total_regular_purchases,
        total_free_purchases: user.total_free_purchases
      }))
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  },

  async getUserByPhoneDigits(phoneDigits: string): Promise<User | null> {
    try {
      console.log('Searching user by phone digits:', phoneDigits)
      const allUsers = await this.getAllUsers()
      const user = allUsers.find(u => {
        const phone = u.phone.replace(/\D/g, '') // Убираем все нецифровые символы
        return phone.endsWith(phoneDigits)
      })
      console.log('User found by phone digits:', user ? `${user.first_name} ${user.last_name}` : 'None')
      return user || null
    } catch (error) {
      console.error('Error searching user by phone digits:', error)
      return null
    }
  },

  async createUser(userData: {
    tg_id: number
    first_name: string
    last_name: string
    phone: string
    username?: string
  }): Promise<User> {
    console.log('Creating user:', userData)
    const now = new Date()
    const user = await prisma.user.create({
      data: {
        tg_id: BigInt(userData.tg_id),
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        username: userData.username,
        created_at: now,
        updated_at: now
      }
    })
    console.log('User created:', user)
    return {
      id: user.id,
      tg_id: Number(user.tg_id),
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_admin: user.is_admin,
      total_purchases: user.total_purchases,
      total_regular_purchases: user.total_regular_purchases,
      total_free_purchases: user.total_free_purchases
    }
  },

  async updateUser(tgId: number, updates: Partial<User>): Promise<User | null> {
    try {
      console.log('Updating user:', { tgId, updates })
      const user = await prisma.user.update({
        where: { tg_id: BigInt(tgId) },
        data: {
          first_name: updates.first_name,
          last_name: updates.last_name,
          phone: updates.phone,
          username: updates.username
        }
      })
      console.log('User updated:', user)
      return {
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_admin: user.is_admin,
        total_purchases: user.total_purchases,
        total_regular_purchases: user.total_regular_purchases,
        total_free_purchases: user.total_free_purchases
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  },

  // Stock operations
  async getUserStocks(userId: number): Promise<Stock[]> {
    try {
      console.log('Getting stocks for user:', userId)
      const stocks = await prisma.stock.findMany({
        where: { user_id: userId },
        orderBy: [
          { stock_name: 'asc' }, // Сначала "5+1 кальян", потом остальные
          { created_at: 'desc' }
        ]
      })
      console.log('Stocks found:', stocks)
      return stocks as Stock[]
    } catch (error) {
      console.error('Error getting user stocks:', error)
      return []
    }
  },

  async createStock(stockData: {
    user_id: number
    stock_name: string
    progress: number
  }): Promise<Stock> {
    console.log('Creating stock:', stockData)
    const stock = await prisma.stock.create({
      data: {
        user_id: stockData.user_id,
        stock_name: stockData.stock_name,
        progress: stockData.progress
      }
    })
    console.log('Stock created:', stock)
    return stock as Stock
  },

  async updateStockProgress(stockId: number, progress: number): Promise<Stock | null> {
    try {
      console.log('Updating stock progress:', { stockId, progress })
      const stock = await prisma.stock.update({
        where: { id: stockId },
        data: { progress }
      })
      console.log('Stock updated:', stock)
      return stock as Stock
    } catch (error) {
      console.error('Error updating stock progress:', error)
      return null
    }
  },

  async updateStockPromotionCompleted(stockId: number, completed: boolean): Promise<Stock | null> {
    try {
      console.log('Updating stock promotion completed:', { stockId, completed })
      const stock = await prisma.stock.update({
        where: { id: stockId },
        data: { promotion_completed: completed }
      })
      console.log('Stock promotion status updated:', stock)
      return stock as Stock
    } catch (error) {
      console.error('Error updating stock promotion status:', error)
      return null
    }
  },

  async decreaseStockProgress(stockId: number): Promise<Stock | null> {
    try {
      console.log('Decreasing stock progress for stock:', stockId)
      
      // Получаем текущий прогресс
      const currentStock = await prisma.stock.findUnique({
        where: { id: stockId }
      })
      
      if (!currentStock) {
        console.error('Stock not found:', stockId)
        return null
      }
      
      // Уменьшаем прогресс на 20% (один слот)
      const newProgress = Math.max(0, currentStock.progress - 20)
      
      const stock = await prisma.stock.update({
        where: { id: stockId },
        data: { progress: newProgress }
      })
      
      console.log('Stock progress decreased:', { from: currentStock.progress, to: newProgress })
      return stock as Stock
    } catch (error) {
      console.error('Error decreasing stock progress:', error)
      return null
    }
  },

  // Free hookah operations
  async getFreeHookahs(userId: number): Promise<FreeHookah[]> {
    try {
      console.log('Getting free hookahs for user:', userId)
      const hookahs = await prisma.freeHookah.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      console.log('Free hookahs found:', hookahs)
      return hookahs as FreeHookah[]
    } catch (error) {
      console.error('Error getting free hookahs:', error)
      return []
    }
  },

  async createFreeHookah(userId: number): Promise<FreeHookah> {
    console.log('Creating free hookah for user:', userId)
    const hookah = await prisma.freeHookah.create({
      data: { user_id: userId }
    })
    console.log('Free hookah created:', hookah)
    return hookah as FreeHookah
  },

  async useFreeHookah(hookahId: number): Promise<FreeHookah | null> {
    try {
      console.log('Using free hookah:', hookahId)
      const hookah = await prisma.freeHookah.update({
        where: { 
          id: hookahId,
          used: false 
        },
        data: { 
          used: true,
          used_at: new Date()
        }
      })
      console.log('Free hookah used:', hookah)
      return hookah as FreeHookah
    } catch (error) {
      console.error('Error using free hookah:', error)
      return null
    }
  },

  async getUnusedFreeHookahs(userId: number): Promise<FreeHookah[]> {
    try {
      console.log('Getting unused free hookahs for user:', userId)
      const hookahs = await prisma.freeHookah.findMany({
        where: { 
          user_id: userId,
          used: false 
        },
        orderBy: { created_at: 'asc' }
      })
      console.log('Unused free hookahs found:', hookahs)
      return hookahs as FreeHookah[]
    } catch (error) {
      console.error('Error getting unused free hookahs:', error)
      return []
    }
  },

  // Hookah history operations
  async getHookahHistory(userId: number): Promise<HookahHistory[]> {
    try {
      console.log('🔍 Getting hookah history for user:', userId)
      
      // Проверяем, что пользователь существует
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        console.error('❌ User not found:', userId)
        return []
      }
      
      console.log('✅ User found:', user)
      
      // Получаем историю
      const history = await prisma.hookahHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      
      console.log('📊 Hookah history found:', history.length, 'records')
      console.log('📊 History details:', history)
      
      return history
    } catch (error) {
      console.error('❌ Error getting hookah history:', error)
      return []
    }
  },

  async getHookahHistoryById(hookahId: number): Promise<HookahHistory | null> {
    try {
      console.log('🔍 Getting hookah history by ID:', hookahId)
      
      const history = await prisma.hookahHistory.findUnique({
        where: { id: hookahId }
      })
      
      if (history) {
        console.log('✅ Hookah history found:', history)
      } else {
        console.log('❌ Hookah history not found for ID:', hookahId)
      }
      
      return history
    } catch (error) {
      console.error('❌ Error getting hookah history by ID:', error)
      return null
    }
  },

  async addHookahToHistory(
    userId: number, 
    hookahType: 'regular' | 'free', 
    slotNumber?: number,
    stockId?: number,
    adminId?: number | null,
    scanMethod?: string
  ): Promise<HookahHistory> {
    const historyId = Math.random().toString(36).substr(2, 9)
    console.log(`📝 [${historyId}] Adding hookah to history:`, { userId, hookahType, slotNumber, stockId, adminId, scanMethod })
    
    try {
      // Проверяем, что пользователь существует
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        console.error(`❌ [${historyId}] User ${userId} not found`)
        throw new Error(`User ${userId} not found`)
      }
      
      console.log(`✅ [${historyId}] User found:`, user)
      
      // Создаем запись с правильным временем
      const history = await prisma.hookahHistory.create({
        data: {
          user_id: userId,
          hookah_type: hookahType,
          slot_number: slotNumber || null,
          created_at: new Date() // Устанавливаем текущее время
        }
      })
      console.log(`✅ [${historyId}] Hookah added to history:`, history)
      
      // Проверяем, что запись действительно создалась
      const createdRecord = await prisma.hookahHistory.findUnique({
        where: { id: history.id }
      })
      console.log(`🔍 [${historyId}] Verification - created record:`, createdRecord)
      
      return history
    } catch (error) {
      console.error(`❌ [${historyId}] Error adding hookah to history:`, error)
      throw error
    }
  },

  async removeLastRegularHookahFromHistory(userId: number): Promise<boolean> {
    try {
      console.log(`🗑️ Removing last regular hookah from history for user:`, userId)
      
      // Находим последнюю запись типа 'regular' для пользователя
      const lastRegularHookah = await prisma.hookahHistory.findFirst({
        where: { 
          user_id: userId,
          hookah_type: 'regular'
        },
        orderBy: { id: 'desc' }
      })
      
      if (!lastRegularHookah) {
        console.log(`❌ No regular hookah found in history for user ${userId}`)
        return false
      }
      
      // Удаляем найденную запись
      await prisma.hookahHistory.delete({
        where: { id: lastRegularHookah.id }
      })
      
      console.log(`✅ Removed last regular hookah from history:`, lastRegularHookah)
      return true
    } catch (error) {
      console.error('❌ Error removing last regular hookah from history:', error)
      return false
    }
  },

  // Admin operations - используем поле is_admin в таблице users как основной метод
  async isUserAdmin(userId: number): Promise<boolean> {
    try {
      // Получаем пользователя
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) return false
      
      // Проверяем поле is_admin в таблице users (основной метод)
      try {
        const isAdminResult = await prisma.$queryRawUnsafe(`
          SELECT is_admin FROM users WHERE id = ${user.id}
        `) as { is_admin: boolean }[]
        
        if (isAdminResult.length > 0 && isAdminResult[0].is_admin) {
          console.log(`User ${user.first_name} ${user.last_name} is admin (is_admin=true, TG ID: ${user.tg_id})`)
          return true
        }
      } catch (error) {
        console.log('is_admin field might not exist, trying fallback methods:', error)
      }
      
      // Fallback: Hardcoded список админов
      const hardcodedAdmins = [937011437, 1159515006] // Основной админ и Кирилл
      if (hardcodedAdmins.includes(Number(user.tg_id))) {
        console.log(`User ${user.first_name} ${user.last_name} is hardcoded admin (TG ID: ${user.tg_id})`)
        return true
      }
      
      // Fallback: Проверяем по TG ID (основной админ)
      const adminTgId = parseInt(process.env.ADMIN_TG_ID || '937011437')
      if (Number(user.tg_id) === adminTgId) {
        console.log(`User ${user.first_name} ${user.last_name} is main admin (TG ID: ${user.tg_id})`)
        return true
      }
      
      // Fallback: Проверяем по списку админов в переменной окружения
      const adminList = process.env.ADMIN_LIST || '1159515006,937011437'
      const adminTgIds = adminList.split(',').map(id => parseInt(id.trim())).filter(id => id > 0)
      if (adminTgIds.includes(Number(user.tg_id))) {
        console.log(`User ${user.first_name} ${user.last_name} is admin from env list (TG ID: ${user.tg_id})`)
        return true
      }
      
      console.log(`User ${user.first_name} ${user.last_name} is not an admin (TG ID: ${user.tg_id})`)
      return false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  },

  async grantAdminRights(userId: number, grantedBy: number): Promise<boolean> {
    try {
      console.log(`Attempting to grant admin rights: userId=${userId}, grantedBy=${grantedBy}`)
      
      // Получаем пользователя
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) {
        console.error(`User with ID ${userId} not found`)
        return false
      }
      
      console.log(`Found user: ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id})`)
      
      // Проверяем, не является ли пользователь уже админом
      const isAlreadyAdmin = await this.isUserAdmin(userId)
      if (isAlreadyAdmin) {
        console.log(`User ${user.first_name} ${user.last_name} is already an admin`)
        return true
      }
      
      // Обновляем поле is_admin в таблице users
      try {
        await prisma.$executeRawUnsafe(`
          UPDATE users 
          SET is_admin = true 
          WHERE id = ${userId}
        `)
        console.log(`✅ Updated is_admin=true for user ${userId}`)
        
        // Также добавляем в переменную окружения ADMIN_LIST (логируем для отладки)
        const currentAdminList = process.env.ADMIN_LIST || '1159515006,937011437'
        const newAdminList = currentAdminList ? `${currentAdminList},${Number(user.tg_id)}` : `${Number(user.tg_id)}`
        console.log(`Would update ADMIN_LIST to: ${newAdminList}`)
        
        console.log(`✅ Admin rights granted to user ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id}) by user ${grantedBy}`)
        return true
      } catch (updateError) {
        console.error('Error updating is_admin field:', updateError)
        return false
      }
    } catch (error) {
      console.error('Error granting admin rights:', error)
      return false
    }
  },

  // Free Hookah Request functions
  async createFreeHookahRequest(userId: number, stockId: number): Promise<number> {
    try {
      const request = await prisma.freeHookahRequest.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          status: 'pending'
        }
      })
      console.log('Free hookah request created:', request)
      return request.id
    } catch (error) {
      console.error('Error creating free hookah request:', error)
      throw error
    }
  },

  async getPendingFreeHookahRequest(userId: number): Promise<FreeHookahRequest | null> {
    try {
      const request = await prisma.freeHookahRequest.findFirst({
        where: {
          user_id: userId,
          status: 'pending'
        }
      })
      return request as FreeHookahRequest | null
    } catch (error) {
      console.error('Error getting pending free hookah request:', error)
      return null
    }
  },

  async getFreeHookahRequestById(requestId: number): Promise<FreeHookahRequest | null> {
    try {
      const request = await prisma.freeHookahRequest.findUnique({
        where: { id: requestId }
      })
      return request as FreeHookahRequest | null
    } catch (error) {
      console.error('Error getting free hookah request by ID:', error)
      return null
    }
  },

  async approveFreeHookahRequest(requestId: number, adminId: number): Promise<boolean> {
    try {
      await prisma.freeHookahRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          approved_by: adminId
        }
      })
      console.log('Free hookah request approved:', requestId)
      return true
    } catch (error) {
      console.error('Error approving free hookah request:', error)
      return false
    }
  },

  async getAllAdmins(): Promise<User[]> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          is_admin: true
        }
      })
      return admins.map(admin => ({
        id: admin.id,
        tg_id: Number(admin.tg_id),
        first_name: admin.first_name,
        last_name: admin.last_name,
        phone: admin.phone,
        username: admin.username,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        is_admin: admin.is_admin,
        total_purchases: admin.total_purchases,
        total_regular_purchases: admin.total_regular_purchases,
        total_free_purchases: admin.total_free_purchases
      })) as User[]
    } catch (error) {
      console.error('Error getting all admins:', error)
      return []
    }
  },

  async checkAdminRights(userId: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { is_admin: true }
      })
      return user?.is_admin || false
    } catch (error) {
      console.error('Error checking admin rights:', error)
      return false
    }
  },

  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user) return null
      
      return {
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
        is_admin: user.is_admin,
        total_purchases: user.total_purchases,
        total_regular_purchases: user.total_regular_purchases,
        total_free_purchases: user.total_free_purchases
      } as User
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  },

  async notifyAdminsAboutFreeHookahRequest(user: User, stock: Stock, requestId: number): Promise<void> {
    try {
      const admins = await this.getAllAdmins()
      console.log(`Notifying ${admins.length} admins about free hookah request ${requestId}`)
      
      // Отправляем уведомление через API бота
      try {
        const response = await fetch(`${process.env.WEBAPP_URL || 'https://frontend-delta-sandy-58.vercel.app'}/api/telegram/notify-admins`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: user,
            stock: stock,
            requestId: requestId
          })
        })
        
        if (response.ok) {
          console.log('✅ Admin notification sent successfully')
        } else {
          console.error('❌ Failed to send admin notification')
        }
      } catch (apiError) {
        console.error('❌ Error calling notification API:', apiError)
      }
    } catch (error) {
      console.error('Error notifying admins:', error)
    }
  },

  async notifyUserAboutApprovedFreeHookah(userId: number): Promise<void> {
    try {
      const user = await this.getUserById(userId)
      if (user) {
        console.log(`📢 Notify user ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id}) about approved free hookah`)
        
        // Отправляем уведомление через API бота
        try {
          const response = await fetch(`${process.env.WEBAPP_URL || 'https://frontend-delta-sandy-58.vercel.app'}/api/telegram/notify-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userTgId: Number(user.tg_id)
            })
          })
          
          if (response.ok) {
            console.log('✅ User notification sent successfully')
          } else {
            console.error('❌ Failed to send user notification')
          }
        } catch (apiError) {
          console.error('❌ Error calling notification API:', apiError)
        }
      }
    } catch (error) {
      console.error('Error notifying user about approved free hookah:', error)
    }
  },

  // Review operations
  async addHookahReview(userId: number, hookahId: number, rating: number, reviewText?: string): Promise<boolean> {
    try {
      console.log('📝 Adding hookah review:', { userId, hookahId, rating, reviewText })
      
      const review = await prisma.hookahReview.create({
        data: {
          user_id: userId,
          hookah_id: hookahId,
          rating: rating,
          review_text: reviewText
        }
      })
      
      console.log('✅ Hookah review added successfully:', review)
      return true
    } catch (error) {
      console.error('❌ Error adding hookah review:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || 'No code',
        meta: (error as any)?.meta || 'No meta'
      })
      return false
    }
  },

  async getHookahReview(userId: number, hookahId: number): Promise<{ rating: number; review_text?: string } | null> {
    try {
      const review = await prisma.hookahReview.findUnique({
        where: {
          user_id_hookah_id: {
            user_id: userId,
            hookah_id: hookahId
          }
        }
      })
      
      if (review) {
        return {
          rating: review.rating,
          review_text: review.review_text || undefined
        }
      }
      
      return null
    } catch (error) {
      console.error('Error getting hookah review:', error)
      return null
    }
  },

  async getHookahHistoryWithReviews(userId: number, page: number = 1, limit: number = 10): Promise<{
    history: Array<HookahHistory & { review?: { rating: number; review_text?: string } }>
    totalPages: number
    currentPage: number
    totalCount: number
  }> {
    try {
      const offset = (page - 1) * limit
      
      const [history, totalCount] = await Promise.all([
        prisma.hookahHistory.findMany({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.hookahHistory.count({
          where: { user_id: userId }
        })
      ])
  
      // Получаем отзывы для каждой записи истории
      const historyWithReviews = await Promise.all(
        history.map(async (hookah) => {
          const review = await prisma.hookahReview.findUnique({
            where: {
              user_id_hookah_id: {
                user_id: userId,
                hookah_id: hookah.id
              }
            }
          })
  
          return {
            ...hookah,
            review: review ? {
              rating: review.rating,
              review_text: review.review_text || undefined
            } : undefined
          }
        })
      )
  
      const totalPages = Math.ceil(totalCount / limit)
  
      return {
        history: historyWithReviews,
        totalPages,
        currentPage: page,
        totalCount
      }
    } catch (error) {
      console.error('Error getting hookah history with reviews:', error)
      return {
        history: [],
        totalPages: 0,
        currentPage: 1,
        totalCount: 0
      }
    }
  },

  // Удаление записи из истории кальянов
  async removeHookahFromHistory(userId: number, hookahType: 'regular' | 'free' = 'regular'): Promise<boolean> {
    try {
      console.log('🗑️ Removing hookah from history:', { userId, hookahType })
      
      // Находим последнюю запись указанного типа
      const lastHistoryRecord = await prisma.hookahHistory.findFirst({
        where: {
          user_id: userId,
          hookah_type: hookahType
        },
        orderBy: { id: 'desc' }
      })

      if (!lastHistoryRecord) {
        console.log('❌ No matching history record found')
        return false
      }

      console.log('📍 Found record to delete:', lastHistoryRecord)

      // Удаляем связанный отзыв, если он есть
      const deletedReviews = await prisma.hookahReview.deleteMany({
        where: {
          user_id: userId,
          hookah_id: lastHistoryRecord.id
        }
      })
      console.log(`🗑️ Deleted ${deletedReviews.count} reviews`)

      // Удаляем запись из истории
      await prisma.hookahHistory.delete({
        where: {
          id: lastHistoryRecord.id
        }
      })

      console.log('✅ Hookah record removed from history:', lastHistoryRecord.id)
      return true
    } catch (error) {
      console.error('❌ Error removing hookah from history:', error)
      return false
    }
  },

  // Debug functions for checking database
  async getAllHookahHistory(): Promise<HookahHistory[]> {
    try {
      const history = await prisma.hookahHistory.findMany({
        orderBy: { created_at: 'desc' }
      })
      return history
    } catch (error) {
      console.error('Error getting all hookah history:', error)
      return []
    }
  },

  async getAllStocks(): Promise<Stock[]> {
    try {
      const stocks = await prisma.stock.findMany()
      return stocks
    } catch (error) {
      console.error('Error getting all stocks:', error)
      return []
    }
  },

  async getAllFreeHookahs(): Promise<FreeHookah[]> {
    try {
      const freeHookahs = await prisma.freeHookah.findMany()
      return freeHookahs
    } catch (error) {
      console.error('Error getting all free hookahs:', error)
      return []
    }
  },

  async getAllUsersCount(): Promise<number> {
    try {
      const count = await prisma.user.count()
      return count
    } catch (error) {
      console.error('Error getting users count:', error)
      return 0
    }
  }
}

export default prisma