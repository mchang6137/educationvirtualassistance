
-- Fix: Allow instructors to send chat messages in their own classes
DROP POLICY "Class members can send messages" ON public.chat_messages;
CREATE POLICY "Class members and instructors can send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM class_members
    WHERE class_members.class_id = chat_messages.class_id
    AND class_members.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = chat_messages.class_id
    AND classes.instructor_id = auth.uid()
  ))
);

-- Fix: Allow instructors to reply to forum threads in their own classes
DROP POLICY "Users can create replies" ON public.forum_replies;
CREATE POLICY "Members and instructors can create replies"
ON public.forum_replies FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM forum_threads ft
    JOIN class_members cm ON cm.class_id = ft.class_id
    WHERE ft.id = forum_replies.thread_id
    AND cm.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM forum_threads ft
    JOIN classes c ON c.id = ft.class_id
    WHERE ft.id = forum_replies.thread_id
    AND c.instructor_id = auth.uid()
  ))
);

-- Fix: Allow instructors to create forum threads in their own classes
DROP POLICY "Class members can create threads" ON public.forum_threads;
CREATE POLICY "Members and instructors can create threads"
ON public.forum_threads FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM class_members
    WHERE class_members.class_id = forum_threads.class_id
    AND class_members.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = forum_threads.class_id
    AND classes.instructor_id = auth.uid()
  ))
);
