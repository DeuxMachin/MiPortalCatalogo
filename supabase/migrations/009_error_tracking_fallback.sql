-- Error tracking fallback (Supabase) para auditoría mínima útil

create table if not exists public.error_registros_fallback (
  id uuid not null default gen_random_uuid(),
  fingerprint text not null,
  bucket_inicio timestamptz not null,
  severidad text not null check (severidad in ('warning', 'error', 'fatal')),
  fuente text not null check (fuente in ('client', 'server')),
  ruta text not null,
  accion text not null,
  mensaje text not null,
  stack text,
  entorno text,
  release_build text,
  contexto jsonb not null default '{}'::jsonb,
  actor_hash text,
  ocurrencias integer not null default 1,
  ultimo_evento_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint error_registros_fallback_pkey primary key (id),
  constraint error_registros_fallback_dedupe_unique unique (fingerprint, bucket_inicio)
);

create index if not exists idx_error_registros_fallback_ult_evento
  on public.error_registros_fallback (ultimo_evento_en desc);

create index if not exists idx_error_registros_fallback_severidad
  on public.error_registros_fallback (severidad, ultimo_evento_en desc);

alter table public.error_registros_fallback enable row level security;
alter table public.error_registros_fallback force row level security;

revoke all on table public.error_registros_fallback from anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'error_registros_fallback'
      and policyname = 'error_registros_fallback_no_direct_access'
  ) then
    create policy error_registros_fallback_no_direct_access
    on public.error_registros_fallback
    for all
    to anon, authenticated
    using (false)
    with check (false);
  end if;
end $$;

create or replace function public.upsert_error_fallback(
  p_fingerprint text,
  p_bucket_inicio timestamptz,
  p_severidad text,
  p_fuente text,
  p_ruta text,
  p_accion text,
  p_mensaje text,
  p_stack text,
  p_entorno text,
  p_release_build text,
  p_contexto jsonb,
  p_actor_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.error_registros_fallback (
    fingerprint,
    bucket_inicio,
    severidad,
    fuente,
    ruta,
    accion,
    mensaje,
    stack,
    entorno,
    release_build,
    contexto,
    actor_hash,
    ocurrencias,
    ultimo_evento_en,
    creado_en,
    actualizado_en
  )
  values (
    p_fingerprint,
    p_bucket_inicio,
    p_severidad,
    p_fuente,
    p_ruta,
    p_accion,
    p_mensaje,
    p_stack,
    p_entorno,
    p_release_build,
    coalesce(p_contexto, '{}'::jsonb),
    p_actor_hash,
    1,
    now(),
    now(),
    now()
  )
  on conflict (fingerprint, bucket_inicio)
  do update
  set ocurrencias = case
      when public.error_registros_fallback.ocurrencias < 2147483647
      then public.error_registros_fallback.ocurrencias + 1
      else public.error_registros_fallback.ocurrencias
    end,
    ultimo_evento_en = now(),
    actualizado_en = now(),
    severidad = excluded.severidad,
    fuente = excluded.fuente,
    ruta = excluded.ruta,
    accion = excluded.accion,
    mensaje = excluded.mensaje,
    stack = excluded.stack,
    entorno = excluded.entorno,
    release_build = excluded.release_build,
    contexto = excluded.contexto,
    actor_hash = excluded.actor_hash;
end;
$$;

revoke all on function public.upsert_error_fallback(text, timestamptz, text, text, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.upsert_error_fallback(text, timestamptz, text, text, text, text, text, text, text, text, jsonb, text) to service_role;

create or replace view public.error_top_7d as
select
  fingerprint,
  max(mensaje) as mensaje,
  max(ruta) as ruta,
  max(accion) as accion,
  max(severidad) as severidad,
  sum(ocurrencias)::bigint as ocurrencias,
  max(ultimo_evento_en) as ultimo_evento_en
from public.error_registros_fallback
where ultimo_evento_en >= now() - interval '7 day'
group by fingerprint
order by ocurrencias desc, ultimo_evento_en desc;

create or replace view public.error_top_30d as
select
  fingerprint,
  max(mensaje) as mensaje,
  max(ruta) as ruta,
  max(accion) as accion,
  max(severidad) as severidad,
  sum(ocurrencias)::bigint as ocurrencias,
  max(ultimo_evento_en) as ultimo_evento_en
from public.error_registros_fallback
where ultimo_evento_en >= now() - interval '30 day'
group by fingerprint
order by ocurrencias desc, ultimo_evento_en desc;
