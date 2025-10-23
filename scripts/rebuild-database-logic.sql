-- Complete database rebuild for hookah loyalty system
-- This script ensures data integrity and correct constraints

-- 1. Add constraints to prevent data corruption
-- Ensure progress never exceeds 100
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_progress_check;
ALTER TABLE stocks ADD CONSTRAINT stocks_progress_check CHECK (progress >= 0 AND progress <= 100);

-- Ensure hookah_type is always valid
ALTER TABLE hookah_history DROP CONSTRAINT IF EXISTS hookah_history_type_check;
ALTER TABLE hookah_history ADD CONSTRAINT hookah_history_type_check CHECK (hookah_type IN ('regular', 'free'));

-- 2. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_hookah_history_user_type ON hookah_history(user_id, hookah_type);
CREATE INDEX IF NOT EXISTS idx_hookah_history_created_desc ON hookah_history(user_id, created_at DESC);

-- 3. Create function to calculate correct progress
CREATE OR REPLACE FUNCTION calculate_correct_progress(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  regular_count INTEGER;
  correct_progress INTEGER;
BEGIN
  -- Count regular hookahs
  SELECT COUNT(*) INTO regular_count
  FROM hookah_history
  WHERE user_id = p_user_id AND hookah_type = 'regular';
  
  -- Calculate progress (max 100)
  correct_progress := LEAST(100, regular_count * 20);
  
  RETURN correct_progress;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to sync stock progress
CREATE OR REPLACE FUNCTION sync_stock_progress(p_user_id INTEGER)
RETURNS VOID AS $$
DECLARE
  correct_progress INTEGER;
  stock_id_var INTEGER;
BEGIN
  -- Calculate correct progress
  correct_progress := calculate_correct_progress(p_user_id);
  
  -- Get stock id
  SELECT id INTO stock_id_var
  FROM stocks
  WHERE user_id = p_user_id AND stock_name = '5+1 кальян'
  LIMIT 1;
  
  IF stock_id_var IS NOT NULL THEN
    -- Update progress
    UPDATE stocks
    SET progress = correct_progress,
        updated_at = NOW()
    WHERE id = stock_id_var;
    
    -- Reset promotion_completed if progress < 100
    IF correct_progress < 100 THEN
      UPDATE stocks
      SET promotion_completed = FALSE
      WHERE id = stock_id_var;
    END IF;
    
    RAISE NOTICE 'Synced user % progress to %', p_user_id, correct_progress;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Sync all users NOW
DO $$
DECLARE
  stock_rec RECORD;
  fixed_count INTEGER := 0;
BEGIN
  FOR stock_rec IN 
    SELECT DISTINCT user_id 
    FROM stocks 
    WHERE stock_name = '5+1 кальян'
  LOOP
    PERFORM sync_stock_progress(stock_rec.user_id);
    fixed_count := fixed_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Fixed % users', fixed_count;
END $$;

-- 6. Create trigger to auto-sync on history changes (OPTIONAL - can cause performance issues)
-- Uncomment if you want automatic sync
/*
CREATE OR REPLACE FUNCTION trigger_sync_progress()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_stock_progress(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_sync_progress_insert ON hookah_history;
CREATE TRIGGER auto_sync_progress_insert
  AFTER INSERT ON hookah_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_progress();

DROP TRIGGER IF EXISTS auto_sync_progress_delete ON hookah_history;
CREATE TRIGGER auto_sync_progress_delete
  AFTER DELETE ON hookah_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_progress();
*/

-- 7. Verify the fix
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.phone,
  s.progress as current_progress,
  calculate_correct_progress(u.id) as correct_progress,
  (SELECT COUNT(*) FROM hookah_history WHERE user_id = u.id AND hookah_type = 'regular') as regular_count
FROM users u
JOIN stocks s ON s.user_id = u.id
WHERE s.stock_name = '5+1 кальян'
  AND s.progress != calculate_correct_progress(u.id)
ORDER BY s.progress DESC
LIMIT 20;

