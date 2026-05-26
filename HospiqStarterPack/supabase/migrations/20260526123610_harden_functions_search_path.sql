alter function public.update_updated_at_column()
  set search_path = public;

alter function public.match_ai_faqs(vector, uuid, text, double precision, integer)
  set search_path = public;

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
