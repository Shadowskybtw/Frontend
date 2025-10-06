import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
}

export interface Stock {
  id: number
  user_id: number
  stock_name: string
  progress: number
  created_at: Date
  updated_at: Date
}

export interface FreeHookah {
  id: number
  user_id: number
  used: boolean
  used_at?: Date
  created_at: Date
}

export interface HookahHistory {
  id: number
  user_id: number
  hookah_type: string
  slot_number?: number | null
  stock_id?: number | null
  admin_id?: number | null
  scan_method?: string | null
  created_at: Date
}

// Database queries
export const db = {
  // Helper to check if database is connected
  isConnected(): boolean {
    return !!prisma
  },

  // User operations
  async getUserByTgId(tgId: number): Promise<User | null> {
    try {
      console.log('🔍 Getting user by TG ID:', tgId)
      console.log('🔍 Searching for tg_id as BigInt:', BigInt(tgId))
      
      const user = await prisma.user.findUnique({
        where: { tg_id: BigInt(tgId) }
      })
      
      console.log('🔍 Raw user from database:', user)
      console.log('🔍 User tg_id type:', typeof user?.tg_id)
      console.log('🔍 User tg_id value:', user?.tg_id)
      
      if (!user) return null
      
      // Convert BigInt to number for JSON serialization
      const convertedUser = {
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      } as User
      
      console.log('✅ Converted user for return:', convertedUser)
      return convertedUser
    } catch (error) {
      console.error('❌ Error getting user by TG ID:', error)
      return null
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Getting all users')
      const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' }
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
        updated_at: user.updated_at
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
    const user = await prisma.user.create({
      data: {
        tg_id: BigInt(userData.tg_id),
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        username: userData.username
      }
    })
    console.log('User created:', user)
    
    // Convert BigInt to number for JSON serialization
    return {
      id: user.id,
      tg_id: Number(user.tg_id),
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at
    } as User
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
      
      // Convert BigInt to number for JSON serialization
      return {
        id: user.id,
        tg_id: Number(user.tg_id),
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at
      } as User
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
        orderBy: { created_at: 'desc' }
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
      console.log('Getting hookah history for user:', userId)
      const history = await prisma.hookahHistory.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      })
      console.log('Hookah history found:', history)
      return history
    } catch (error) {
      console.error('Error getting hookah history:', error)
      return []
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
    return history
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
        orderBy: { created_at: 'desc' }
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
      const adminTgIds = adminList.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
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
        const newAdminList = currentAdminList ? `${currentAdminList},${user.tg_id}` : `${user.tg_id}`
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
  }
}

export default prisma