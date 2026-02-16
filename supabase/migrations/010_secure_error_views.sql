-- Harden access to fallback error views (views do not support RLS directly)

revoke all on view public.error_top_7d from public, anon, authenticated;
revoke all on view public.error_top_30d from public, anon, authenticated;

grant select on view public.error_top_7d to service_role;
grant select on view public.error_top_30d to service_role;

-- Ensure view executes with caller privileges where supported
alter view public.error_top_7d set (security_invoker = true);
alter view public.error_top_30d set (security_invoker = true);
