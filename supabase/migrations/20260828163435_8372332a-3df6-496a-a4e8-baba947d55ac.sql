-- ============ enum extensions ============
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'todo';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'blocked';

-- ============ departments ============
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  head_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments readable by staff" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments managed by leadership" ON public.departments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
GRANT INSERT, UPDATE, DELETE ON public.departments TO authenticated;
CREATE TRIGGER departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ projects ============
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects readable by staff" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects managed by managers" ON public.projects FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ task columns ============
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_by uuid;

-- ============ employee_profile columns ============
ALTER TABLE public.employee_profile
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- ============ announcements ============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'notice',
  audience text NOT NULL DEFAULT 'all',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_id uuid,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements readable by staff" ON public.announcements FOR SELECT TO authenticated USING (published OR author_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "announcements written by managers" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid())));
CREATE POLICY "announcements updated by author or leadership" ON public.announcements FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "announcements deleted by author or leadership" ON public.announcements FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ notifications ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'info',
  link text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications readable by owner" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications updatable by owner" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications deletable by owner" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications insertable by staff" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.can_access_user(auth.uid(), user_id) OR public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));

-- ============ audit logs ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  target_type text NOT NULL DEFAULT '',
  target_id text NOT NULL DEFAULT '',
  target_name text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit readable by leadership" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "audit insertable by staff" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- ============ attendance corrections ============
CREATE TABLE public.attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  work_date date NOT NULL,
  requested_status public.attendance_status NOT NULL,
  requested_check_in time,
  requested_check_out time,
  reason text NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_corrections TO authenticated;
GRANT ALL ON public.attendance_corrections TO service_role;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "corrections readable in scope" ON public.attendance_corrections FOR SELECT TO authenticated USING (public.can_access_user(auth.uid(), user_id));
CREATE POLICY "corrections created by owner" ON public.attendance_corrections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "corrections decided by approver" ON public.attendance_corrections FOR UPDATE TO authenticated
  USING (public.can_approve_user(auth.uid(), user_id) OR user_id = auth.uid())
  WITH CHECK (public.can_approve_user(auth.uid(), user_id) OR user_id = auth.uid());
CREATE POLICY "corrections deleted by owner" ON public.attendance_corrections FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER attendance_corrections_updated_at BEFORE UPDATE ON public.attendance_corrections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ performance reviews ============
CREATE TABLE public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reviewer_id uuid,
  period_label text NOT NULL,
  goals_total integer NOT NULL DEFAULT 0,
  goals_met integer NOT NULL DEFAULT 0,
  manager_rating numeric NOT NULL DEFAULT 0,
  feedback text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_reviews TO authenticated;
GRANT ALL ON public.performance_reviews TO service_role;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews readable in scope" ON public.performance_reviews FOR SELECT TO authenticated USING (public.can_access_user(auth.uid(), user_id));
CREATE POLICY "reviews written by approver" ON public.performance_reviews FOR INSERT TO authenticated WITH CHECK (public.can_approve_user(auth.uid(), user_id));
CREATE POLICY "reviews updated by approver" ON public.performance_reviews FOR UPDATE TO authenticated
  USING (public.can_approve_user(auth.uid(), user_id)) WITH CHECK (public.can_approve_user(auth.uid(), user_id));
CREATE POLICY "reviews deleted by approver" ON public.performance_reviews FOR DELETE TO authenticated USING (public.can_approve_user(auth.uid(), user_id));
CREATE TRIGGER performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();