-- Create or replace the leaderboard update function with new scoring system
-- Correct predictions: +10 points
-- Wrong predictions: -10 points (penalty)
CREATE OR REPLACE FUNCTION update_leaderboard_stats(
  p_wallet_address TEXT,
  p_hashed_wallet TEXT,
  p_is_correct BOOLEAN,
  p_points INTEGER
)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update leaderboard entry
  -- Points can now be negative (-10 for wrong predictions)
  INSERT INTO leaderboard (
    wallet_address,
    hashed_wallet,
    total_predictions,
    correct_predictions,
    total_points
  ) VALUES (
    p_wallet_address,
    p_hashed_wallet,
    1,
    CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    p_points
  )
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    total_predictions = leaderboard.total_predictions + 1,
    correct_predictions = leaderboard.correct_predictions + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
    total_points = leaderboard.total_points + p_points,
    updated_at = NOW();
END;
$$;