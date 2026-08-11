CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own tasks" ON public.tasks FOR ALL TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'))
WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();