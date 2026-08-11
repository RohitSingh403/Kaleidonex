create type public.claim_status as enum ('pending','approved','paid','rejected');

create sequence public.expense_claim_seq;

create table public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  claim_no text not null unique default 'EXP-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.expense_claim_seq')::text, 4, '0'),
  user_id uuid not null default auth.uid(),
  expense_date date not null default current_date,
  category text not null default 'Travel',
  purpose text not null default '',
  amount numeric not null default 0,
  status public.claim_status not null default 'pending',
  proof_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

grant usage, select on sequence public.expense_claim_seq to authenticated;
grant usage, select on sequence public.expense_claim_seq to service_role;
grant select, insert, update, delete on public.expense_claims to authenticated;
grant all on public.expense_claims to service_role;
alter table public.expense_claims enable row level security;

create policy "users read own claims" on public.expense_claims for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
create policy "users create own claims" on public.expense_claims for insert to authenticated
  with check (user_id = auth.uid());
create policy "admins update claims" on public.expense_claims for update to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'))
  with check (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));
create policy "admins delete claims" on public.expense_claims for delete to authenticated
  using (has_role(auth.uid(),'admin') or has_role(auth.uid(),'editor'));