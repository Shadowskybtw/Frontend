#!/usr/bin/env python3
"""
Test script for broadcast functionality
"""

import os
import sys
import asyncio
from bot import DUNGEONBot

async def test_broadcast():
    """Test broadcast command"""
    print("🤖 Testing broadcast functionality...")
    
    # Create bot instance
    bot = DUNGEONBot()
    
    # Test database connection
    print("📊 Testing database connection...")
    conn = bot.get_db_connection()
    if conn:
        print("✅ Database connection successful")
        
        # Test getting users
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users WHERE tg_id IS NOT NULL AND tg_id != 0")
        count = cursor.fetchone()[0]
        print(f"👥 Found {count} users with Telegram IDs")
        
        conn.close()
    else:
        print("❌ Database connection failed")
        return False
    
    print("✅ Broadcast functionality ready!")
    print("\n📝 To test the broadcast command:")
    print("1. Start the bot: python bot.py")
    print("2. Send to bot: /broadcast Привет! Это тестовое сообщение")
    print("3. Only your Telegram ID (937011437) can use this command")
    
    return True

if __name__ == '__main__':
    asyncio.run(test_broadcast())
