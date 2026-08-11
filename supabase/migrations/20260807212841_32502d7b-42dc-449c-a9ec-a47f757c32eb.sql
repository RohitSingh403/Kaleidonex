create type public.attendance_status as enum ('present','absent','half_day','leave','paid_leave','holiday');
create type public.leave_status as enum ('pending','approved','rejected');
create type public.salary_status as enum ('pending','paid');
create type public.request_status as enum ('pending','approved','rejected');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  work_date date not null default current_date,
  status public.attendance_status not null default 'present',
  check_in time,
  check_out time,
  daily_update text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_date)
);
grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "users manage own attendance" on public.attendance for all to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create table public.leave_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  leave_type text not null default 'Casual',
  start_date date not null default current_date,
  end_date date not null default current_date,
  days integer not null default 1,
  reason text not null default '',
  status public.leave_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.leave_applications to authenticated;
grant all on public.leave_applications to service_role;
alter table public.leave_applications enable row level security;
create policy "users manage own leaves" on public.leave_applications for all to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create table public.salary_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  period_month integer not null default 1,
  period_year integer not null default 2026,
  days integer not null default 30,
  basic_salary numeric not null default 0,
  earnings numeric not null default 0,
  deductions numeric not null default 0,
  net_pay numeric not null default 0,
  status public.salary_status not null default 'pending',
  paid_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.salary_records to authenticated;
grant all on public.salary_records to service_role;
alter table public.salary_records enable row level security;
create policy "users read own salary" on public.salary_records for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
create policy "admins manage salary" on public.salary_records for all to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create table public.employee_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  request_type text not null default 'Salary Query',
  details text not null default '',
  note text not null default '',
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.employee_requests to authenticated;
grant all on public.employee_requests to service_role;
alter table public.employee_requests enable row level security;
create policy "users manage own requests" on public.employee_requests for all to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public;

create trigger attendance_updated_at before update on public.attendance for each row execute function public.set_updated_at();
create trigger leave_applications_updated_at before update on public.leave_applications for each row execute function public.set_updated_at();
create trigger salary_records_updated_at before update on public.salary_records for each row execute function public.set_updated_at();
create trigger employee_requests_updated_at before update on public.employee_requests for each row execute function public.set_updated_at();