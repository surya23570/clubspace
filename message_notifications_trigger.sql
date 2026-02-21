-- Trigger to auto-notify on new message
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Find the recipient from the conversation participants
  SELECT 
    CASE 
      WHEN participant_1 = NEW.sender_id THEN participant_2 
      ELSE participant_1 
    END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Insert notification for the recipient
  INSERT INTO notifications (user_id, actor_id, type, title, message, resource_id)
  VALUES (
    recipient_id,
    NEW.sender_id,
    'comment', -- Reuse 'comment' type for messages since we don't have 'message' type constraint yet, OR update constraint. 
               -- ideally we should alter the constraint, but for now 'comment' icon is a MessageCircle so it fits visually.
               -- Better: Let's assume the check constraint allows 'message' if we can, 
               -- but looking at schema: CHECK (type IN ('follow', 'like', 'comment', 'system'))
               -- We should update the check constraint to include 'message'.
               -- For safety without migration complex: Use 'comment' as it maps to MessageCircle icon.
    'New Message',
    LEFT(NEW.content, 50), -- Preview content
    NEW.conversation_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();
