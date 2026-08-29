revoke execute on function public.assigned_hr_of(uuid) from anon, public;
revoke execute on function public.can_access_user(uuid, uuid) from anon, public;
revoke execute on function public.can_approve_user(uuid, uuid) from anon, public;
revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.is_hr(uuid) from anon, public;
revoke execute on function public.is_super_admin(uuid) from anon, public;
revoke execute on function public.manages_user(uuid, uuid) from anon, public;

grant execute on function public.assigned_hr_of(uuid) to authenticated;
grant execute on function public.can_access_user(uuid, uuid) to authenticated;
grant execute on function public.can_approve_user(uuid, uuid) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_hr(uuid) to authenticated;
grant execute on function public.is_super_admin(uuid) to authenticated;
grant execute on function public.manages_user(uuid, uuid) to authenticated;