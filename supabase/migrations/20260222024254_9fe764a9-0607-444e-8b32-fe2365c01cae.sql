
-- Drop the recursive policy
DROP POLICY "Members can view class members" ON public.class_members;

-- Recreate without self-referencing subquery
CREATE POLICY "Members can view class members"
ON public.class_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'instructor'::app_role)
);
