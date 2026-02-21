-- We will create an RPC function that runs as SECURITY DEFINER to check if a block exists.
CREATE OR REPLACE FUNCTION debug_check_blocks(p_user1 UUID, p_user2 UUID)
RETURNS JSONB AS $$
DECLARE
  res JSONB;
BEGIN
  SELECT jsonb_agg(row_to_json(b)) INTO res
  FROM blocks b
  WHERE (blocker_id = p_user1 AND blocked_id = p_user2)
     OR (blocker_id = p_user2 AND blocked_id = p_user1);
  RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
