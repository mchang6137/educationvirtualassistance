
-- Allow users to delete their own chat messages
CREATE POLICY "Users can delete own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own forum replies
CREATE POLICY "Users can delete own replies"
ON public.forum_replies
FOR DELETE
USING (auth.uid() = user_id);
