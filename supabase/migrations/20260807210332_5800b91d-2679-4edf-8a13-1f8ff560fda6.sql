create or replace function public.grant_admin_to_first_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles limit 1) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.grant_admin_to_first_user() from public;
revoke execute on function public.grant_admin_to_first_user() from anon;
revoke execute on function public.grant_admin_to_first_user() from authenticated;

create trigger on_auth_user_created_grant_first_admin
after insert on auth.users
for each row execute function public.grant_admin_to_first_user();