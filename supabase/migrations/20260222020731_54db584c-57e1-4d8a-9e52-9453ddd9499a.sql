
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'instructor');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors can create classes" ON public.classes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "Instructors can update own classes" ON public.classes FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

-- Class members
CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view class members" ON public.class_members FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = class_members.class_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can join classes" ON public.class_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave classes" ON public.class_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Chat messages (anonymous)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Question',
  is_ai BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = chat_messages.class_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'instructor')
);
CREATE POLICY "Class members can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = chat_messages.class_id AND user_id = auth.uid())
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Forum threads
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General Question',
  tags TEXT[] DEFAULT '{}',
  upvotes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members can view threads" ON public.forum_threads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = forum_threads.class_id AND user_id = auth.uid())
  OR public.has_role(auth.uid(), 'instructor')
);
CREATE POLICY "Class members can create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = forum_threads.class_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own threads" ON public.forum_threads FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Forum replies
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE NOT NULL,
  parent_reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  upvotes INT NOT NULL DEFAULT 0,
  is_instructor_validated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies" ON public.forum_replies FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.forum_threads ft
    JOIN public.class_members cm ON cm.class_id = ft.class_id
    WHERE ft.id = forum_replies.thread_id AND cm.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'instructor')
);
CREATE POLICY "Users can create replies" ON public.forum_replies FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.forum_threads ft
    JOIN public.class_members cm ON cm.class_id = ft.class_id
    WHERE ft.id = forum_replies.thread_id AND cm.user_id = auth.uid()
  )
);
CREATE POLICY "Instructors can validate replies" ON public.forum_replies FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'instructor')
);

-- Thread upvotes tracking
CREATE TABLE public.thread_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (thread_id, user_id)
);
ALTER TABLE public.thread_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view upvotes" ON public.thread_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upvote" ON public.thread_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove upvote" ON public.thread_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reply upvotes tracking
CREATE TABLE public.reply_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (reply_id, user_id)
);
ALTER TABLE public.reply_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reply upvotes" ON public.reply_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upvote replies" ON public.reply_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove reply upvote" ON public.reply_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Saved threads
CREATE TABLE public.saved_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, thread_id)
);
ALTER TABLE public.saved_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved threads" ON public.saved_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save threads" ON public.saved_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave threads" ON public.saved_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Anonymous'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
