
-- Add is_starred column to chat_messages (only instructors can star)
ALTER TABLE public.chat_messages ADD COLUMN is_starred boolean NOT NULL DEFAULT false;

-- Allow instructors to update chat messages (for starring)
CREATE POLICY "Instructors can star messages"
ON public.chat_messages
FOR UPDATE
USING (has_role(auth.uid(), 'instructor'::app_role));

-- Create chat_reactions table for emoji reactions
CREATE TABLE public.chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: class members can view reactions (via message's class)
CREATE POLICY "Class members can view reactions"
ON public.chat_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN class_members clm ON clm.class_id = cm.class_id
    WHERE cm.id = chat_reactions.message_id AND clm.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'instructor'::app_role)
);

-- RLS: authenticated users can add reactions
CREATE POLICY "Users can add reactions"
ON public.chat_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_messages cm
    JOIN class_members clm ON clm.class_id = cm.class_id
    WHERE cm.id = chat_reactions.message_id AND clm.user_id = auth.uid()
  )
);

-- RLS: users can remove own reactions
CREATE POLICY "Users can remove own reactions"
ON public.chat_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
