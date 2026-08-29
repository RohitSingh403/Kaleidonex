-- Department budgeting
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS cost_center text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent numeric NOT NULL DEFAULT 0;

-- Review cycles
CREATE TABLE IF NOT EXISTS public.review_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_cycles TO authenticated;
GRANT ALL ON public.review_cycles TO service_role;
ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read review cycles" ON public.review_cycles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "managers manage review cycles" ON public.review_cycles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));
CREATE TRIGGER review_cycles_updated_at BEFORE UPDATE ON public.review_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 1:1 notes
CREATE TABLE IF NOT EXISTS public.one_on_one_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id uuid,
  meeting_date date NOT NULL DEFAULT current_date,
  agenda text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  action_items text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.one_on_one_notes TO authenticated;
GRANT ALL ON public.one_on_one_notes TO service_role;
ALTER TABLE public.one_on_one_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoped read 1:1 notes" ON public.one_on_one_notes
  FOR SELECT TO authenticated
  USING (public.can_access_user(auth.uid(), employee_id));
CREATE POLICY "managers write 1:1 notes" ON public.one_on_one_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.can_approve_user(auth.uid(), employee_id));
CREATE POLICY "managers update 1:1 notes" ON public.one_on_one_notes
  FOR UPDATE TO authenticated
  USING (public.can_approve_user(auth.uid(), employee_id))
  WITH CHECK (public.can_approve_user(auth.uid(), employee_id));
CREATE POLICY "managers delete 1:1 notes" ON public.one_on_one_notes
  FOR DELETE TO authenticated
  USING (public.can_approve_user(auth.uid(), employee_id));
CREATE TRIGGER one_on_one_notes_updated_at BEFORE UPDATE ON public.one_on_one_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Onboarding checklist
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  due_date date,
  is_done boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_tasks TO authenticated;
GRANT ALL ON public.onboarding_tasks TO service_role;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoped read onboarding" ON public.onboarding_tasks
  FOR SELECT TO authenticated
  USING (public.can_access_user(auth.uid(), user_id));
CREATE POLICY "managers create onboarding" ON public.onboarding_tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.can_approve_user(auth.uid(), user_id));
CREATE POLICY "owner or manager update onboarding" ON public.onboarding_tasks
  FOR UPDATE TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (public.can_access_user(auth.uid(), user_id));
CREATE POLICY "managers delete onboarding" ON public.onboarding_tasks
  FOR DELETE TO authenticated
  USING (public.can_approve_user(auth.uid(), user_id));
CREATE TRIGGER onboarding_tasks_updated_at BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Organisation settings (key/value)
CREATE TABLE IF NOT EXISTS public.org_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read org settings" ON public.org_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "leadership write org settings" ON public.org_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER org_settings_updated_at BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.org_settings (key, value) VALUES
  ('working_days', '{"days":["mon","tue","wed","thu","fri"],"start":"09:00","end":"18:00","late_after":"09:15"}'::jsonb),
  ('leave_types', '{"types":[{"name":"Casual Leave","annual":12},{"name":"Sick Leave","annual":8},{"name":"Earned Leave","annual":15},{"name":"Unpaid Leave","annual":0}]}'::jsonb),
  ('notifications', '{"email_enabled":true,"webhook_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;