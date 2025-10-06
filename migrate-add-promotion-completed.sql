-- Add promotion_completed column to stocks table
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS promotion_completed BOOLEAN DEFAULT FALSE;

-- Update existing stocks to have promotion_completed = false
UPDATE stocks SET promotion_completed = FALSE WHERE promotion_completed IS NULL;
