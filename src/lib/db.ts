import { neon } from '@neondatabase/serverless'

let sql: ReturnType<typeof neon> | null = null

function getSql() {
  if (!sql && process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

// In-memory database for development
const inMemoryDb = {
  users: new Map<number, User>(),
  stocks: new Map<number, Stock[]>(),
  freeHookahs: new Map<number, FreeHookah[]>(),
  nextUserId: 1,
  nextStockId: 1,
  nextHookahId: 1
}

export default getSql

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
    return !!process.env.DATABASE_URL && !!getSql()
  },

  // User operations
  async getUserByTgId(tgId: number): Promise<User | null> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const users = await sql`
        SELECT * FROM users WHERE tg_id = ${tgId} LIMIT 1
      ` as User[]
      return users[0] || null
    } else {
      // Use in-memory database
      console.log('Using in-memory database for getUserByTgId:', tgId)
      for (const user of inMemoryDb.users.values()) {
        if (user.tg_id === tgId) {
          return user
        }
      }
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
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [user] = await sql`
        INSERT INTO users (tg_id, first_name, last_name, phone, username)
        VALUES (${userData.tg_id}, ${userData.first_name}, ${userData.last_name}, ${userData.phone}, ${userData.username})
        RETURNING *
      ` as User[]
      return user
    } else {
      // Use in-memory database
      const user: User = {
        id: inMemoryDb.nextUserId++,
        tg_id: userData.tg_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        username: userData.username,
        created_at: new Date(),
        updated_at: new Date()
      }
      inMemoryDb.users.set(user.id, user)
      console.log('Created user in in-memory database:', user)
      return user
    }
  },

  async updateUser(tgId: number, updates: Partial<User>): Promise<User | null> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [user] = await sql`
        UPDATE users 
        SET 
          first_name = COALESCE(${updates.first_name}, first_name),
          last_name = COALESCE(${updates.last_name}, last_name),
          phone = COALESCE(${updates.phone}, phone),
          username = COALESCE(${updates.username}, username),
          updated_at = NOW()
        WHERE tg_id = ${tgId}
        RETURNING *
      ` as User[]
      return user || null
    } else {
      // Use in-memory database
      for (const user of inMemoryDb.users.values()) {
        if (user.tg_id === tgId) {
          if (updates.first_name) user.first_name = updates.first_name
          if (updates.last_name) user.last_name = updates.last_name
          if (updates.phone) user.phone = updates.phone
          if (updates.username) user.username = updates.username
          user.updated_at = new Date()
          console.log('Updated user in in-memory database:', user)
          return user
        }
      }
      return null
    }
  },

  // Stock operations
  async getUserStocks(userId: number): Promise<Stock[]> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      return await sql`
        SELECT * FROM stocks WHERE user_id = ${userId} ORDER BY created_at DESC
      ` as Stock[]
    } else {
      // Use in-memory database
      console.log('Getting stocks from in-memory database for user:', userId)
      return inMemoryDb.stocks.get(userId) || []
    }
  },

  async createStock(stockData: {
    user_id: number
    stock_name: string
    progress: number
  }): Promise<Stock> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [stock] = await sql`
        INSERT INTO stocks (user_id, stock_name, progress)
        VALUES (${stockData.user_id}, ${stockData.stock_name}, ${stockData.progress})
        RETURNING *
      ` as Stock[]
      return stock
    } else {
      // Use in-memory database
      const stock: Stock = {
        id: inMemoryDb.nextStockId++,
        user_id: stockData.user_id,
        stock_name: stockData.stock_name,
        progress: stockData.progress,
        created_at: new Date(),
        updated_at: new Date()
      }
      
      if (!inMemoryDb.stocks.has(stockData.user_id)) {
        inMemoryDb.stocks.set(stockData.user_id, [])
      }
      inMemoryDb.stocks.get(stockData.user_id)!.push(stock)
      
      console.log('Created stock in in-memory database:', stock)
      return stock
    }
  },

  async updateStockProgress(stockId: number, progress: number): Promise<Stock | null> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [stock] = await sql`
        UPDATE stocks 
        SET progress = ${progress}, updated_at = NOW()
        WHERE id = ${stockId}
        RETURNING *
      ` as Stock[]
      return stock || null
    } else {
      // Use in-memory database
      for (const userStocks of inMemoryDb.stocks.values()) {
        const stock = userStocks.find(s => s.id === stockId)
        if (stock) {
          stock.progress = progress
          stock.updated_at = new Date()
          console.log('Updated stock progress in in-memory database:', stock)
          return stock
        }
      }
      return null
    }
  },

  // Free hookah operations
  async getFreeHookahs(userId: number): Promise<FreeHookah[]> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      return await sql`
        SELECT * FROM free_hookahs WHERE user_id = ${userId} ORDER BY created_at DESC
      ` as FreeHookah[]
    } else {
      // Use in-memory database
      return inMemoryDb.freeHookahs.get(userId) || []
    }
  },

  async createFreeHookah(userId: number): Promise<FreeHookah> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [hookah] = await sql`
        INSERT INTO free_hookahs (user_id)
        VALUES (${userId})
        RETURNING *
      ` as FreeHookah[]
      return hookah
    } else {
      // Use in-memory database
      const hookah: FreeHookah = {
        id: inMemoryDb.nextHookahId++,
        user_id: userId,
        used: false,
        created_at: new Date()
      }
      
      if (!inMemoryDb.freeHookahs.has(userId)) {
        inMemoryDb.freeHookahs.set(userId, [])
      }
      inMemoryDb.freeHookahs.get(userId)!.push(hookah)
      
      console.log('Created free hookah in in-memory database:', hookah)
      return hookah
    }
  },

  async useFreeHookah(hookahId: number): Promise<FreeHookah | null> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      const [hookah] = await sql`
        UPDATE free_hookahs 
        SET used = true, used_at = NOW()
        WHERE id = ${hookahId} AND used = false
        RETURNING *
      ` as FreeHookah[]
      return hookah || null
    } else {
      // Use in-memory database
      for (const userHookahs of inMemoryDb.freeHookahs.values()) {
        const hookah = userHookahs.find(h => h.id === hookahId && !h.used)
        if (hookah) {
          hookah.used = true
          hookah.used_at = new Date()
          console.log('Used free hookah in in-memory database:', hookah)
          return hookah
        }
      }
      return null
    }
  },

  async getUnusedFreeHookahs(userId: number): Promise<FreeHookah[]> {
    const sql = getSql()
    if (sql) {
      // Use real database if available
      return await sql`
        SELECT * FROM free_hookahs 
        WHERE user_id = ${userId} AND used = false 
        ORDER BY created_at ASC
      ` as FreeHookah[]
    } else {
      // Use in-memory database
      const userHookahs = inMemoryDb.freeHookahs.get(userId) || []
      return userHookahs.filter(h => !h.used).sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
    }
  }
}
