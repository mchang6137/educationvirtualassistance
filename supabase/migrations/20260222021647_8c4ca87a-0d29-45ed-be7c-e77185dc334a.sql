
-- Drop the existing INSERT policy that doesn't work pre-confirmation
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

-- Create a trigger function to auto-assign role from user metadata on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for role assignment
CREATE TRIGGER on_auth_user_role_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();
