-- === Reporting hierarchy ===
alter table public.employee_profile
  add column if not exists manager_id uuid references auth.users(id) on delete set null,
  add column if not exists department text not null default '';

create index if not exists employee_profile_manager_idx on public.employee_profile(manager_id);

-- === Approval trail ===
alter table public.leave_applications
  add column if not exists decided_by uuid references auth.users(id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text not null default '';

alter table public.expense_claims
  add column if not exists decided_by uuid references auth.users(id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text not null default '';

alter table public.employee_requests
  add column if not exists decided_by uuid references auth.users(id) on delete set null,
  add column if not exists decided_at timestamptz,
  add column if not exists decision_note text not null default '';

-- === Access helpers ===
create or replace function public.is_super_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','ceo')
  );
$$;

create or replace function public.is_hr(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = 'hr'
  );
$$;

create or replace function public.manages_user(_manager_id uuid, _target_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.employee_profile
    where user_id = _target_id and manager_id = _manager_id
  );
$$;

-- viewer may see target's records
create or replace function public.can_access_user(_viewer_id uuid, _target_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _viewer_id = _target_id
      or public.is_super_admin(_viewer_id)
      or public.manages_user(_viewer_id, _target_id);
$$;

-- viewer may approve / act on target's records (not their own)
create or replace function public.can_approve_user(_viewer_id uuid, _target_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_super_admin(_viewer_id)
      or public.manages_user(_viewer_id, _target_id);
$$;

revoke execute on function public.is_super_admin(uuid) from public, anon;
revoke execute on function public.is_hr(uuid) from public, anon;
revoke execute on function public.manages_user(uuid, uuid) from public, anon;
revoke execute on function public.can_access_user(uuid, uuid) from public, anon;
revoke execute on function public.can_approve_user(uuid, uuid) from public, anon;
grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.is_hr(uuid) to authenticated;
grant execute on function public.manages_user(uuid, uuid) to authenticated;
grant execute on function public.can_access_user(uuid, uuid) to authenticated;
grant execute on function public.can_approve_user(uuid, uuid) to authenticated;

-- === Roles visibility ===
drop policy if exists "users read own roles" on public.user_roles;
create policy "read roles in scope" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin(auth.uid()) or public.is_hr(auth.uid()));

-- === Profiles ===
drop policy if exists "users read own profile" on public.profiles;
create policy "read profiles in scope" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin(auth.uid()) or public.is_hr(auth.uid()));

-- === Attendance ===
drop policy if exists "users manage own attendance" on public.attendance;
create policy "attendance read scope" on public.attendance for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "attendance insert own" on public.attendance for insert to authenticated
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "attendance update scope" on public.attendance for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "attendance delete scope" on public.attendance for delete to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));

-- === Leave applications ===
drop policy if exists "users manage own leaves" on public.leave_applications;
create policy "leave read scope" on public.leave_applications for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "leave insert own" on public.leave_applications for insert to authenticated
  with check (user_id = auth.uid());
create policy "leave update scope" on public.leave_applications for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "leave delete scope" on public.leave_applications for delete to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));

-- === Salary ===
drop policy if exists "admins manage salary" on public.salary_records;
drop policy if exists "users read own salary" on public.salary_records;
create policy "salary read scope" on public.salary_records for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "salary write scope" on public.salary_records for insert to authenticated
  with check (public.can_approve_user(auth.uid(), user_id));
create policy "salary update scope" on public.salary_records for update to authenticated
  using (public.can_approve_user(auth.uid(), user_id))
  with check (public.can_approve_user(auth.uid(), user_id));
create policy "salary delete scope" on public.salary_records for delete to authenticated
  using (public.can_approve_user(auth.uid(), user_id));

-- === Employee requests ===
drop policy if exists "users manage own requests" on public.employee_requests;
create policy "requests read scope" on public.employee_requests for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "requests insert own" on public.employee_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy "requests update scope" on public.employee_requests for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "requests delete scope" on public.employee_requests for delete to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));

-- === Tasks ===
drop policy if exists "users manage own tasks" on public.tasks;
create policy "tasks read scope" on public.tasks for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "tasks insert scope" on public.tasks for insert to authenticated
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "tasks update scope" on public.tasks for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "tasks delete scope" on public.tasks for delete to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));

-- === Expense claims ===
drop policy if exists "users read own claims" on public.expense_claims;
drop policy if exists "users create own claims" on public.expense_claims;
drop policy if exists "admins update claims" on public.expense_claims;
drop policy if exists "admins delete claims" on public.expense_claims;
create policy "claims read scope" on public.expense_claims for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "claims insert own" on public.expense_claims for insert to authenticated
  with check (user_id = auth.uid());
create policy "claims update scope" on public.expense_claims for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "claims delete scope" on public.expense_claims for delete to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));

-- === Employment records ===
drop policy if exists "own employee profile" on public.employee_profile;
create policy "employee profile read scope" on public.employee_profile for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "employee profile insert scope" on public.employee_profile for insert to authenticated
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id) or public.is_hr(auth.uid()));
create policy "employee profile update scope" on public.employee_profile for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "employee profile delete scope" on public.employee_profile for delete to authenticated
  using (public.is_super_admin(auth.uid()));

drop policy if exists "own employee personal" on public.employee_personal;
create policy "employee personal read scope" on public.employee_personal for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "employee personal write own" on public.employee_personal for insert to authenticated
  with check (user_id = auth.uid());
create policy "employee personal update own" on public.employee_personal for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "employee personal delete scope" on public.employee_personal for delete to authenticated
  using (public.is_super_admin(auth.uid()));

drop policy if exists "own employee documents" on public.employee_documents;
create policy "employee documents read scope" on public.employee_documents for select to authenticated
  using (public.can_access_user(auth.uid(), user_id));
create policy "employee documents insert own" on public.employee_documents for insert to authenticated
  with check (user_id = auth.uid());
create policy "employee documents update scope" on public.employee_documents for update to authenticated
  using (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id))
  with check (user_id = auth.uid() or public.can_approve_user(auth.uid(), user_id));
create policy "employee documents delete scope" on public.employee_documents for delete to authenticated
  using (user_id = auth.uid() or public.is_super_admin(auth.uid()));