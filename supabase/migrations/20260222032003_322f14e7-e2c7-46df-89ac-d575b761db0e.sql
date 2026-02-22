
-- Allow instructors to add reactions even if not a class member
DROP POLICY "Users can add reactions" ON public.chat_reactions;

CREATE POLICY "Users can add reactions"
ON public.chat_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (
      SELECT 1 FROM chat_messages cm
      JOIN class_members clm ON clm.class_id = cm.class_id
      WHERE cm.id = chat_reactions.message_id AND clm.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'instructor'::app_role)
  )
);
