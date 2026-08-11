create type public.student_status as enum ('verified','pending','rejected');
create type public.exam_status as enum ('draft','published');

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  grade text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (grade, name)
);
grant select, insert, update, delete on public.sections to authenticated;
grant all on public.sections to service_role;
alter table public.sections enable row level security;
create policy "admins manage sections" on public.sections for all to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  phone text not null default '',
  grade text not null default '',
  section_id uuid references public.sections(id) on delete set null,
  roll_no text not null default '',
  school_id uuid references public.schools(id) on delete set null,
  status public.student_status not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "admins manage students" on public.students for all to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null default '',
  grade text not null default '',
  status public.exam_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  total_marks integer not null default 100,
  average_score numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.exams to authenticated;
grant all on public.exams to service_role;
alter table public.exams enable row level security;
create policy "admins manage exams" on public.exams for all to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));