CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  board text NOT NULL DEFAULT 'CBSE',
  template_type text NOT NULL DEFAULT 'Lesson Plan',
  grade text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  is_draft boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or admin templates" ON public.templates FOR SELECT TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "admins create templates" ON public.templates FOR INSERT TO authenticated
WITH CHECK ((has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')) AND user_id = auth.uid());

CREATE POLICY "admins update templates" ON public.templates FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "admins delete templates" ON public.templates FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE TRIGGER templates_updated_at BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.templates (user_id, title, board, template_type, grade, subject, is_draft, is_published)
SELECT u.id, 'Photosynthesis', 'CBSE', 'Lesson Plan', 'Grade 7', 'Science', true, true
FROM auth.users u ORDER BY u.created_at LIMIT 1;

INSERT INTO public.templates (user_id, title, board, template_type, grade, subject, is_draft, is_published)
SELECT u.id, 'Intro to Robotics Quiz', 'CBSE', 'Quiz', 'Grade 8', 'Robotics', true, false
FROM auth.users u ORDER BY u.created_at LIMIT 1;