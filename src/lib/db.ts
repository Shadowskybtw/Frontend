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
  username?: string
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

// Database queries
export const db = {
  // Helper to check if database is connected
  isConnected(): boolean {
    return !!prisma
  },

  // User operations
  async getUserByTgId(tgId: number): Promise<User | null> {
    try {
      console.log('Getting user by TG ID:', tgId)
      const user = await prisma.user.findUnique({
        where: { tg_id: BigInt(tgId) }
      })
      console.log('User found:', user)
      
      if (!user) return null
      
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
      console.error('Error getting user by TG ID:', error)
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
  }
}

export default prisma