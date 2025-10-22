-- Migration: Add Loyalty System Tables
-- Created: 2025-10-22
-- Description: Adds campaigns, loyalty_slots, rewards, reward_states, and events_audit tables

-- Campaigns table for managing loyalty programs
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slots_required INTEGER NOT NULL DEFAULT 5 CHECK (slots_required > 0),
  active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty slots table for tracking user progress
CREATE TABLE IF NOT EXISTS loyalty_slots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index >= 1), -- 1-based slot numbering
  filled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id, slot_index)
);

-- Rewards table for defining rewards
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('free_hookah', 'discount', 'bonus_item')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward states table for tracking user reward status
CREATE TABLE IF NOT EXISTS reward_states (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reward_id INTEGER REFERENCES rewards(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'consumed', 'expired')),
  available_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  consumed_at TIMESTAMP WITH TIME ZONE,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id, reward_id)
);

-- Events audit table for logging system events
CREATE TABLE IF NOT EXISTS events_audit (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_loyalty_slots_user_campaign ON loyalty_slots(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_slots_filled ON loyalty_slots(filled_at) WHERE filled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rewards_campaign ON rewards(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reward_states_user_status ON reward_states(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reward_states_campaign ON reward_states(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_audit_user ON events_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_events_audit_type ON events_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_events_audit_created ON events_audit(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_states_updated_at BEFORE UPDATE ON reward_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default campaign
INSERT INTO campaigns (name, slots_required, active, started_at)
VALUES ('5+1 кальян', 5, TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Get the campaign ID for the default reward
DO $$
DECLARE
  campaign_id_var INTEGER;
BEGIN
  SELECT id INTO campaign_id_var FROM campaigns WHERE name = '5+1 кальян' LIMIT 1;
  
  IF campaign_id_var IS NOT NULL THEN
    INSERT INTO rewards (campaign_id, reward_type, title, description)
    VALUES (campaign_id_var, 'free_hookah', 'Бесплатный кальян', 'Получи 1 бесплатный кальян после покупки 5 обычных')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

