-- =====================================================================
-- KALEIDONEX COMPLETE DATABASE SCHEMA & SUPER ADMIN SETUP SCRIPT
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. ENUMS AND TYPES
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'ceo', 'hr', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_type AS ENUM ('contact', 'demo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.school_status AS ENUM ('prospect', 'active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.teacher_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('verified', 'pending', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.exam_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'half_day', 'leave', 'paid_leave', 'holiday');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.salary_status AS ENUM ('pending', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'todo', 'review', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_state AS ENUM ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'escalated', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_act AS ENUM ('submit', 'approve', 'reject', 'escalate', 'cancel', 'comment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- 2. SEQUENCES & CORE UTILITY FUNCTIONS
-- =====================================================================
CREATE SEQUENCE IF NOT EXISTS public.expense_claim_seq;
CREATE SEQUENCE IF NOT EXISTS public.approval_request_seq;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- 3. CORE ROLES & PROFILES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'ceo')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_hr(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'hr'
  );
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 4. ORGANIZATION STRUCTURE & DEPARTMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  head_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.projects (
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

-- =====================================================================
-- 5. EMPLOYEE MANAGEMENT & HIERARCHY
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.employee_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  employee_code text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  manager_name text NOT NULL DEFAULT '',
  manager_email text NOT NULL DEFAULT '',
  joining_date date,
  employment_type text NOT NULL DEFAULT 'Full-Time',
  work_mode text NOT NULL DEFAULT 'Onsite',
  status text NOT NULL DEFAULT 'Active',
  work_location text NOT NULL DEFAULT '',
  working_organisation text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  verified_by text NOT NULL DEFAULT '',
  verified_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_profile TO authenticated;
GRANT ALL ON public.employee_profile TO service_role;
ALTER TABLE public.employee_profile ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.employee_personal (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text NOT NULL DEFAULT '',
  blood_group text NOT NULL DEFAULT '',
  marital_status text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  alternate_number text NOT NULL DEFAULT '',
  personal_email text NOT NULL DEFAULT '',
  cur_street text NOT NULL DEFAULT '',
  cur_city text NOT NULL DEFAULT '',
  cur_state text NOT NULL DEFAULT '',
  cur_pincode text NOT NULL DEFAULT '',
  perm_street text NOT NULL DEFAULT '',
  perm_city text NOT NULL DEFAULT '',
  perm_state text NOT NULL DEFAULT '',
  perm_pincode text NOT NULL DEFAULT '',
  emergency_name text NOT NULL DEFAULT '',
  emergency_number text NOT NULL DEFAULT '',
  emergency_relation text NOT NULL DEFAULT '',
  emergency_address text NOT NULL DEFAULT '',
  bank_account_holder text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  bank_account_number text NOT NULL DEFAULT '',
  bank_ifsc text NOT NULL DEFAULT '',
  bank_branch text NOT NULL DEFAULT '',
  pan_no text NOT NULL DEFAULT '',
  aadhaar_no text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_personal TO authenticated;
GRANT ALL ON public.employee_personal TO service_role;
ALTER TABLE public.employee_personal ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  info text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO authenticated;
GRANT ALL ON public.employee_documents TO service_role;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.manages_user(_manager_id uuid, _target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_profile
    WHERE user_id = _target_id AND manager_id = _manager_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_user(_viewer_id uuid, _target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer_id = _target_id
      OR public.is_super_admin(_viewer_id)
      OR public.is_hr(_viewer_id)
      OR public.manages_user(_viewer_id, _target_id);
$$;

CREATE OR REPLACE FUNCTION public.can_approve_user(_viewer_id uuid, _target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(_viewer_id)
      OR public.is_hr(_viewer_id)
      OR public.manages_user(_viewer_id, _target_id);
$$;

-- =====================================================================
-- 6. ATTENDANCE, LEAVES, SALARY & EXPENSES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date date NOT NULL DEFAULT current_date,
  status public.attendance_status NOT NULL DEFAULT 'present',
  check_in time,
  check_out time,
  daily_update text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, work_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'Casual',
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL DEFAULT current_date,
  days integer NOT NULL DEFAULT 1,
  reason text NOT NULL DEFAULT '',
  status public.leave_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_applications TO authenticated;
GRANT ALL ON public.leave_applications TO service_role;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  period_month integer NOT NULL DEFAULT 1,
  period_year integer NOT NULL DEFAULT 2026,
  days integer NOT NULL DEFAULT 30,
  basic_salary numeric NOT NULL DEFAULT 0,
  earnings numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  status public.salary_status NOT NULL DEFAULT 'pending',
  paid_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_records TO authenticated;
GRANT ALL ON public.salary_records TO service_role;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.expense_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_no text NOT NULL UNIQUE DEFAULT 'EXP-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.expense_claim_seq')::text, 4, '0'),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_date date NOT NULL DEFAULT current_date,
  category text NOT NULL DEFAULT 'Travel',
  purpose text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  status public.claim_status NOT NULL DEFAULT 'pending',
  proof_urls text[] NOT NULL DEFAULT '{}',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_claims TO authenticated;
GRANT ALL ON public.expense_claims TO service_role;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.expense_claims(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_receipts TO authenticated;
GRANT ALL ON public.expense_receipts TO service_role;
ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.employee_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'Salary Query',
  details text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'pending',
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_requests TO authenticated;
GRANT ALL ON public.employee_requests TO service_role;
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 7. TASKS, TEMPLATES & AUDIT LOGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  progress integer NOT NULL DEFAULT 0,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.templates (
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

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id text,
  target_type text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 8. CRM: LEADS, PRODUCTS, PROGRAMMES, SCHOOLS, TEACHERS, STUDENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.lead_type NOT NULL DEFAULT 'contact',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  school text,
  enquiry_type text,
  message text NOT NULL,
  interests text[] DEFAULT '{}',
  status public.lead_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price text NOT NULL,
  stock text NOT NULL DEFAULT 'In stock',
  features text[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'solution',
  summary text NOT NULL DEFAULT '',
  features text[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programmes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programmes TO authenticated;
GRANT ALL ON public.programmes TO service_role;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT 'School-funded',
  status public.school_status NOT NULL DEFAULT 'prospect',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  specialization text NOT NULL DEFAULT '',
  status public.teacher_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grade, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  roll_no text NOT NULL DEFAULT '',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  status public.student_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 9. APPROVAL RULES & ORG SETTINGS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.approval_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'expense',
  threshold_amount numeric NOT NULL DEFAULT 0,
  requires_ceo boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approval_rules TO authenticated;
GRANT ALL ON public.approval_rules TO service_role;
ALTER TABLE public.approval_rules ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.org_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_settings TO authenticated;
GRANT ALL ON public.org_settings TO service_role;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.approval_rules (rule_key, label, kind, threshold_amount, requires_ceo, enabled) VALUES
  ('expense_ceo_threshold', 'Expenses at or above this amount need CEO approval', 'expense', 5000, true, true),
  ('leave_ceo_threshold', 'Leave longer than this many days needs CEO approval', 'leave', 10, true, true),
  ('escalation_termination', 'Employee termination requires CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_salary', 'Salary changes require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_transfer', 'Department transfers require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_hiring', 'Hiring requests require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_policy', 'Policy exceptions require CEO approval', 'hr_escalation', 0, true, true)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO public.org_settings (key, value) VALUES
  ('working_days', '{"days":["mon","tue","wed","thu","fri"],"start":"09:00","end":"18:00","late_after":"09:15"}'::jsonb),
  ('leave_types', '{"types":[{"name":"Casual Leave","annual":12},{"name":"Sick Leave","annual":8},{"name":"Earned Leave","annual":15},{"name":"Unpaid Leave","annual":0}]}'::jsonb),
  ('notifications', '{"email_enabled":true,"webhook_url":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
DROP POLICY IF EXISTS "read roles in scope" ON public.user_roles;
CREATE POLICY "read roles in scope" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));

DROP POLICY IF EXISTS "read profiles in scope" ON public.profiles;
CREATE POLICY "read profiles in scope" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));

DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "anon can submit leads" ON public.leads;
CREATE POLICY "anon can submit leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authed can submit leads" ON public.leads;
CREATE POLICY "authed can submit leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admins manage leads" ON public.leads;
CREATE POLICY "admins manage leads" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "public sees published products" ON public.products;
CREATE POLICY "public sees published products" ON public.products FOR SELECT TO anon USING (published = true);

DROP POLICY IF EXISTS "authed sees products" ON public.products;
CREATE POLICY "authed sees products" ON public.products FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage products" ON public.products;
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "public sees published programmes" ON public.programmes;
CREATE POLICY "public sees published programmes" ON public.programmes FOR SELECT TO anon USING (published = true);

DROP POLICY IF EXISTS "authed sees programmes" ON public.programmes;
CREATE POLICY "authed sees programmes" ON public.programmes FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage programmes" ON public.programmes;
CREATE POLICY "admins manage programmes" ON public.programmes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage schools" ON public.schools;
CREATE POLICY "admins manage schools" ON public.schools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage teachers" ON public.teachers;
CREATE POLICY "admins manage teachers" ON public.teachers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins manage students" ON public.students;
CREATE POLICY "admins manage students" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "employee profile read scope" ON public.employee_profile;
CREATE POLICY "employee profile read scope" ON public.employee_profile FOR SELECT TO authenticated
  USING (public.can_access_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "employee profile write scope" ON public.employee_profile;
CREATE POLICY "employee profile write scope" ON public.employee_profile FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "employee personal scope" ON public.employee_personal;
CREATE POLICY "employee personal scope" ON public.employee_personal FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "employee documents scope" ON public.employee_documents;
CREATE POLICY "employee documents scope" ON public.employee_documents FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "attendance scope" ON public.attendance;
CREATE POLICY "attendance scope" ON public.attendance FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "leave scope" ON public.leave_applications;
CREATE POLICY "leave scope" ON public.leave_applications FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "salary scope" ON public.salary_records;
CREATE POLICY "salary scope" ON public.salary_records FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (public.can_approve_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "claims scope" ON public.expense_claims;
CREATE POLICY "claims scope" ON public.expense_claims FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "tasks scope" ON public.tasks;
CREATE POLICY "tasks scope" ON public.tasks FOR ALL TO authenticated
  USING (public.can_access_user(auth.uid(), user_id))
  WITH CHECK (user_id = auth.uid() OR public.can_approve_user(auth.uid(), user_id));

DROP POLICY IF EXISTS "departments scope" ON public.departments;
CREATE POLICY "departments scope" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "departments admin" ON public.departments FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "projects scope" ON public.projects;
CREATE POLICY "projects scope" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects admin" ON public.projects FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_hr(auth.uid()));

DROP POLICY IF EXISTS "staff read org settings" ON public.org_settings;
CREATE POLICY "staff read org settings" ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write org settings" ON public.org_settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "staff read rules" ON public.approval_rules;
CREATE POLICY "staff read rules" ON public.approval_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin write rules" ON public.approval_rules FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================================
-- 11. SUPER ADMIN AUTOMATION (kaleidonextechnologies@gmail.com)
-- =====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_superadmin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_grant_first_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kaleidonex User'))
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email, '')) = 'kaleidonextechnologies@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'), (NEW.id, 'ceo')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.employee_profile (user_id, full_name, designation, status)
    VALUES (NEW.id, 'Kaleidonex Super Admin', 'Chief Executive Officer (Super Admin)', 'Active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================================
-- 12. PERMISSION REPAIR & SCHEMA CACHE RELOAD
-- Fixes "database error querying schema" in PostgREST
-- =====================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
