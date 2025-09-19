#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the schema file
const schemaPath = path.join(__dirname, '../src/lib/schema.sql')
const schema = fs.readFileSync(schemaPath, 'utf8')

console.log('=== Neon Database Setup ===')
console.log('')
console.log('1. Create a Neon database at https://neon.tech')
console.log('2. Copy your connection string')
console.log('3. Add it to your .env.local file:')
console.log('   DATABASE_URL=postgresql://username:password@hostname/database')
console.log('')
console.log('4. Run the following SQL in your Neon SQL Editor:')
console.log('')
console.log('--- SQL Schema ---')
console.log(schema)
console.log('--- End Schema ---')
console.log('')
console.log('5. Or use psql:')
console.log('   psql "your-connection-string" -f src/lib/schema.sql')
console.log('')
console.log('6. Start the development server:')
console.log('   npm run dev')
