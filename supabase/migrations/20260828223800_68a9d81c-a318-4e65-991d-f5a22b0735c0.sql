-- ============ ENUMS ============
create type public.approval_state as enum (
  'DRAFT','SUBMITTED','PENDING_HR','HR_APPROVED','PENDING_CEO',
  'CEO_APPROVED','REJECTED','CHANGES_REQUESTED','CANCELLED'
);

create type public.approval_kind as enum (
  'leave','expense','attendance_correction','employee_request','hr_escalation'
);

create type public.approval_act as enum (
  'submit','approve','reject','request_changes','escalate','cancel'
);

-- ============ HELPERS ============
create or replace function public.assigned_hr_of(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select manager_id from public.employee_profile where user_id = _user_id;
$$;

-- ============ APPROVAL REQUESTS ============
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  kind public.approval_kind not null,
  requester_id uuid not null references auth.users(id) on delete cascade,
  resource_table text not null default '',
  resource_id uuid,
  title text not null default '',
  summary text not null default '',
  amount numeric not null default 0,
  state public.approval_state not null default 'PENDING_HR',
  current_approver_id uuid,
  requires_ceo boolean not null default false,
  hr_id uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index approval_requests_requester_idx on public.approval_requests(requester_id);
create index approval_requests_approver_idx on public.approval_requests(current_approver_id);
create index approval_requests_state_idx on public.approval_requests(state);

grant select, insert, update on public.approval_requests to authenticated;
grant all on public.approval_requests to service_role;
alter table public.approval_requests enable row level security;

create policy "requests readable in scope" on public.approval_requests
for select to authenticated using (
  requester_id = auth.uid()
  or hr_id = auth.uid()
  or current_approver_id = auth.uid()
  or public.is_super_admin(auth.uid())
  or public.manages_user(auth.uid(), requester_id)
);

create policy "employees raise own requests" on public.approval_requests
for insert to authenticated with check (requester_id = auth.uid());

create policy "approvers update in scope" on public.approval_requests
for update to authenticated using (
  requester_id = auth.uid()
  or current_approver_id = auth.uid()
  or public.is_super_admin(auth.uid())
  or public.manages_user(auth.uid(), requester_id)
) with check (
  requester_id = auth.uid()
  or current_approver_id = auth.uid()
  or public.is_super_admin(auth.uid())
  or public.manages_user(auth.uid(), requester_id)
);

create trigger approval_requests_updated_at
before update on public.approval_requests
for each row execute function public.set_updated_at();

-- ============ APPROVAL ACTIONS (append-only) ============
create table public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.approval_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  actor_role text not null default '',
  action public.approval_act not null,
  previous_state public.approval_state,
  new_state public.approval_state not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index approval_actions_request_idx on public.approval_actions(request_id);

grant select, insert on public.approval_actions to authenticated;
grant all on public.approval_actions to service_role;
alter table public.approval_actions enable row level security;

create policy "history readable with the request" on public.approval_actions
for select to authenticated using (
  exists (
    select 1 from public.approval_requests r
    where r.id = request_id and (
      r.requester_id = auth.uid()
      or r.hr_id = auth.uid()
      or r.current_approver_id = auth.uid()
      or public.is_super_admin(auth.uid())
      or public.manages_user(auth.uid(), r.requester_id)
    )
  )
);

create policy "actors append history" on public.approval_actions
for insert to authenticated with check (actor_id = auth.uid());

-- ============ APPROVAL RULES ============
create table public.approval_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null default '',
  kind public.approval_kind not null,
  threshold_amount numeric not null default 0,
  requires_ceo boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.approval_rules to authenticated;
grant all on public.approval_rules to service_role;
alter table public.approval_rules enable row level security;

create policy "staff read rules" on public.approval_rules
for select to authenticated using (true);

create policy "ceo manages rules" on public.approval_rules
for all to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

grant insert, update, delete on public.approval_rules to authenticated;

create trigger approval_rules_updated_at
before update on public.approval_rules
for each row execute function public.set_updated_at();

insert into public.approval_rules (rule_key, label, kind, threshold_amount, requires_ceo, enabled) values
  ('expense_ceo_threshold', 'Expenses at or above this amount need CEO approval', 'expense', 5000, true, true),
  ('leave_ceo_threshold', 'Leave longer than this many days needs CEO approval', 'leave', 10, true, true),
  ('escalation_termination', 'Employee termination requires CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_salary', 'Salary changes require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_transfer', 'Department transfers require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_hiring', 'Hiring requests require CEO approval', 'hr_escalation', 0, true, true),
  ('escalation_policy', 'Policy exceptions require CEO approval', 'hr_escalation', 0, true, true);

-- ============ EXPENSE RECEIPTS ============
create table public.expense_receipts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.expense_claims(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text not null default '',
  file_name text not null default '',
  created_at timestamptz not null default now()
);

create index expense_receipts_claim_idx on public.expense_receipts(claim_id);

grant select, insert, delete on public.expense_receipts to authenticated;
grant all on public.expense_receipts to service_role;
alter table public.expense_receipts enable row level security;

create policy "receipts readable in scope" on public.expense_receipts
for select to authenticated using (public.can_access_user(auth.uid(), user_id));

create policy "own receipts insert" on public.expense_receipts
for insert to authenticated with check (user_id = auth.uid());

create policy "own receipts delete" on public.expense_receipts
for delete to authenticated using (user_id = auth.uid());

-- ============ TASK COMMENTS ============
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create index task_comments_task_idx on public.task_comments(task_id);

grant select, insert on public.task_comments to authenticated;
grant all on public.task_comments to service_role;
alter table public.task_comments enable row level security;

create policy "comments readable in scope" on public.task_comments
for select to authenticated using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.can_access_user(auth.uid(), t.user_id)
  )
);

create policy "comment as self in scope" on public.task_comments
for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.tasks t
    where t.id = task_id and public.can_access_user(auth.uid(), t.user_id)
  )
);

-- ============ EXPENSE CLAIM WORKFLOW COLUMNS ============
alter table public.expense_claims
  add column if not exists approval_state public.approval_state not null default 'PENDING_HR',
  add column if not exists hr_id uuid,
  add column if not exists requires_ceo boolean not null default false;