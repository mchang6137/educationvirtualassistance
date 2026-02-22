
CREATE TABLE public.chat_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.chat_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat upvotes"
ON public.chat_upvotes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can upvote"
ON public.chat_upvotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own upvote"
ON public.chat_upvotes FOR DELETE
USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_upvotes;
