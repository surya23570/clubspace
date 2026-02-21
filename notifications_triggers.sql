-- Trigger to auto-notify on reaction (like)
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id = (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, actor_id, type, title, message, resource_id)
  VALUES (
    (SELECT user_id FROM posts WHERE id = NEW.post_id), -- Post owner
    NEW.user_id, -- Reactor
    'like',
    'New Like',
    'liked your post',
    NEW.post_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_reaction_created
  AFTER INSERT ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reaction();
