
-- Table for recurring weekly class schedules
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view schedules"
ON public.class_schedules FOR SELECT
USING (true);

CREATE POLICY "Instructors can manage own class schedules"
ON public.class_schedules FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_schedules.class_id AND classes.instructor_id = auth.uid()
));

CREATE POLICY "Instructors can update own class schedules"
ON public.class_schedules FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_schedules.class_id AND classes.instructor_id = auth.uid()
));

CREATE POLICY "Instructors can delete own class schedules"
ON public.class_schedules FOR DELETE
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_schedules.class_id AND classes.instructor_id = auth.uid()
));

-- Storage bucket for slides
INSERT INTO storage.buckets (id, name, public) VALUES ('slides', 'slides', true);

CREATE POLICY "Anyone can view slides"
ON storage.objects FOR SELECT
USING (bucket_id = 'slides');

CREATE POLICY "Instructors can upload slides"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'slides' AND has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Instructors can delete slides"
ON storage.objects FOR DELETE
USING (bucket_id = 'slides' AND has_role(auth.uid(), 'instructor'::app_role));

-- Table for slide decks
CREATE TABLE public.class_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.class_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members can view slides"
ON public.class_slides FOR SELECT
USING (
  EXISTS (SELECT 1 FROM class_members WHERE class_members.class_id = class_slides.class_id AND class_members.user_id = auth.uid())
  OR has_role(auth.uid(), 'instructor'::app_role)
);

CREATE POLICY "Instructors can upload slides"
ON public.class_slides FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_slides.class_id AND classes.instructor_id = auth.uid()
));

CREATE POLICY "Instructors can delete slides"
ON public.class_slides FOR DELETE
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = class_slides.class_id AND classes.instructor_id = auth.uid()
));

-- Table for real-time slide presentation state
CREATE TABLE public.slide_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE UNIQUE,
  current_slide_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.slide_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view slide sessions"
ON public.slide_sessions FOR SELECT
USING (true);

CREATE POLICY "Instructors can insert slide sessions"
ON public.slide_sessions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = slide_sessions.class_id AND classes.instructor_id = auth.uid()
));

CREATE POLICY "Instructors can update slide sessions"
ON public.slide_sessions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM classes WHERE classes.id = slide_sessions.class_id AND classes.instructor_id = auth.uid()
));

ALTER PUBLICATION supabase_realtime ADD TABLE public.slide_sessions;
