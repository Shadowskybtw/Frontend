const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
})

async function fixDatabase() {
  try {
    console.log('Fixing database schema...')
    
    // 1. Добавляем поле stock_id в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='stock_id';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        console.log('✅ Column stock_id already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN stock_id INTEGER;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        console.log('✅ Column stock_id added to hookah_history table successfully.')
      }
    } catch (error) {
      console.error('❌ Error adding stock_id field:', error)
    }

    // 2. Добавляем поле admin_id в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='admin_id';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        console.log('✅ Column admin_id already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN admin_id INTEGER;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        console.log('✅ Column admin_id added to hookah_history table successfully.')
      }
    } catch (error) {
      console.error('❌ Error adding admin_id field:', error)
    }

    // 3. Добавляем поле scan_method в таблицу hookah_history
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='hookah_history' AND column_name='scan_method';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        console.log('✅ Column scan_method already exists in hookah_history table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE hookah_history
          ADD COLUMN scan_method VARCHAR(50);
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        console.log('✅ Column scan_method added to hookah_history table successfully.')
      }
    } catch (error) {
      console.error('❌ Error adding scan_method field:', error)
    }

    // 4. Добавляем поле is_admin в таблицу users
    try {
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='users' AND column_name='is_admin';
      `
      const columnExists = await prisma.$queryRawUnsafe(checkColumnQuery)

      if (Array.isArray(columnExists) && columnExists.length > 0) {
        console.log('✅ Column is_admin already exists in users table.')
      } else {
        const addColumnQuery = `
          ALTER TABLE users
          ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
        `
        await prisma.$executeRawUnsafe(addColumnQuery)
        console.log('✅ Column is_admin added to users table successfully.')
      }
    } catch (error) {
      console.error('❌ Error adding is_admin field:', error)
    }

    console.log('Database fix complete!')
    
  } catch (error) {
    console.error('Error fixing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabase()
