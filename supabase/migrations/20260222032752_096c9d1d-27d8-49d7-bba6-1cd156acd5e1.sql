
-- Create thread_subscriptions table for "notify me" feature
CREATE TABLE public.thread_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE public.thread_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.thread_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can subscribe"
ON public.thread_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsubscribe"
ON public.thread_subscriptions
FOR DELETE
USING (auth.uid() = user_id);
