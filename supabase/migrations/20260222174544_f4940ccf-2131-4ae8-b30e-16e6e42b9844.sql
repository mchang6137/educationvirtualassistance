
-- Enable full replica identity so DELETE events include the old row data
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.forum_replies REPLICA IDENTITY FULL;
