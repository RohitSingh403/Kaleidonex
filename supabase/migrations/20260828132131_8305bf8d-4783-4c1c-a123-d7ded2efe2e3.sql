CREATE TABLE public.employee_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  employee_code text NOT NULL DEFAULT '',
  joining_date date,
  employment_type text NOT NULL DEFAULT 'Full-Time',
  work_mode text NOT NULL DEFAULT 'Onsite',
  status text NOT NULL DEFAULT 'Active',
  work_location text NOT NULL DEFAULT '',
  working_organisation text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  manager_name text NOT NULL DEFAULT '',
  manager_email text NOT NULL DEFAULT '',
  is_verified boolean NOT NULL DEFAULT false,
  verified_by text NOT NULL DEFAULT '',
  verified_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_profile TO authenticated;
GRANT ALL ON public.employee_profile TO service_role;
ALTER TABLE public.employee_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own employee profile" ON public.employee_profile FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.employee_personal (
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
CREATE POLICY "own employee personal" ON public.employee_personal FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.employee_documents (
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
CREATE POLICY "own employee documents" ON public.employee_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER employee_profile_updated_at BEFORE UPDATE ON public.employee_profile FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER employee_personal_updated_at BEFORE UPDATE ON public.employee_personal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();