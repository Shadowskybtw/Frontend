import { neon } from '@neondatabase/serverless'

let sql: ReturnType<typeof neon> | null = null

function getSql() {
  if (!sql && process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
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
    if (!sql) throw new Error('Database not connected')
    const users = await sql`
      SELECT * FROM users WHERE tg_id = ${tgId} LIMIT 1
    ` as User[]
    return users[0] || null
  },

  async createUser(userData: {
    tg_id: number
    first_name: string
    last_name: string
    phone: string
    username?: string
  }): Promise<User> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    const [user] = await sql`
      INSERT INTO users (tg_id, first_name, last_name, phone, username)
      VALUES (${userData.tg_id}, ${userData.first_name}, ${userData.last_name}, ${userData.phone}, ${userData.username})
      RETURNING *
    ` as User[]
    return user
  },

  async updateUser(tgId: number, updates: Partial<User>): Promise<User | null> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
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
  },

  // Stock operations
  async getUserStocks(userId: number): Promise<Stock[]> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    return await sql`
      SELECT * FROM stocks WHERE user_id = ${userId} ORDER BY created_at DESC
    ` as Stock[]
  },

  async createStock(stockData: {
    user_id: number
    stock_name: string
    progress: number
  }): Promise<Stock> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    const [stock] = await sql`
      INSERT INTO stocks (user_id, stock_name, progress)
      VALUES (${stockData.user_id}, ${stockData.stock_name}, ${stockData.progress})
      RETURNING *
    ` as Stock[]
    return stock
  },

  async updateStockProgress(stockId: number, progress: number): Promise<Stock | null> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    const [stock] = await sql`
      UPDATE stocks 
      SET progress = ${progress}, updated_at = NOW()
      WHERE id = ${stockId}
      RETURNING *
    ` as Stock[]
    return stock || null
  },

  // Free hookah operations
  async getFreeHookahs(userId: number): Promise<FreeHookah[]> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    return await sql`
      SELECT * FROM free_hookahs WHERE user_id = ${userId} ORDER BY created_at DESC
    ` as FreeHookah[]
  },

  async createFreeHookah(userId: number): Promise<FreeHookah> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    const [hookah] = await sql`
      INSERT INTO free_hookahs (user_id)
      VALUES (${userId})
      RETURNING *
    ` as FreeHookah[]
    return hookah
  },

  async useFreeHookah(hookahId: number): Promise<FreeHookah | null> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    const [hookah] = await sql`
      UPDATE free_hookahs 
      SET used = true, used_at = NOW()
      WHERE id = ${hookahId} AND used = false
      RETURNING *
    ` as FreeHookah[]
    return hookah || null
  },

  async getUnusedFreeHookahs(userId: number): Promise<FreeHookah[]> {
    const sql = getSql()
    if (!sql) throw new Error('Database not connected')
    return await sql`
      SELECT * FROM free_hookahs 
      WHERE user_id = ${userId} AND used = false 
      ORDER BY created_at ASC
    ` as FreeHookah[]
  }
}
