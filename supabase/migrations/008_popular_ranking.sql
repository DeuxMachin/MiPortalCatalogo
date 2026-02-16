-- Popularidad catálogo (30 días) con tracking anónimo + anti-spam
-- Eventos: view, click, favorite
-- score = peso_view*views_30d + peso_click*clicks_30d + peso_favorite*favs_30d

create table if not exists public.catalogo_popular_pesos (
  id boolean primary key default true,
  peso_view numeric not null default 1,
  peso_click numeric not null default 2,
  peso_favorite numeric not null default 3,
  actualizado_en timestamptz not null default now()
);

insert into public.catalogo_popular_pesos (id, peso_view, peso_click, peso_favorite)
values (true, 1, 2, 3)
on conflict (id) do nothing;

create table if not exists public.producto_interaccion_guardas (
  producto_id uuid not null references public.productos(id) on delete cascade,
  tipo_evento text not null check (tipo_evento in ('view', 'click', 'favorite')),
  actor_id text not null,
  bucket_inicio timestamptz not null,
  conteo integer not null default 1,
  actualizado_en timestamptz not null default now(),
  primary key (producto_id, tipo_evento, actor_id, bucket_inicio)
);

create table if not exists public.producto_interacciones (
  id uuid not null default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  tipo_evento text not null check (tipo_evento in ('view', 'click', 'favorite')),
  accion_click text,
  actor_id text not null,
  ocurrido_en timestamptz not null default now(),
  creado_en timestamptz not null default now(),
  constraint producto_interacciones_pkey primary key (id)
);

create table if not exists public.producto_popularidad_diaria (
  producto_id uuid not null references public.productos(id) on delete cascade,
  dia date not null,
  vistas integer not null default 0,
  clicks integer not null default 0,
  favoritos integer not null default 0,
  actualizado_en timestamptz not null default now(),
  constraint producto_popularidad_diaria_pkey primary key (producto_id, dia)
);

create index if not exists idx_producto_interacciones_ocurrido_en
  on public.producto_interacciones (ocurrido_en desc);

create index if not exists idx_producto_interacciones_producto_evento
  on public.producto_interacciones (producto_id, tipo_evento, ocurrido_en desc);

create index if not exists idx_producto_popularidad_diaria_dia
  on public.producto_popularidad_diaria (dia desc);

alter table public.producto_interaccion_guardas enable row level security;
alter table public.producto_interacciones enable row level security;
alter table public.producto_popularidad_diaria enable row level security;

-- Fuerza RLS incluso para el owner (defensa extra)
alter table public.producto_interaccion_guardas force row level security;
alter table public.producto_interacciones force row level security;
alter table public.producto_popularidad_diaria force row level security;

-- Evita cualquier acceso directo por SQL desde roles de app;
-- el acceso debe ocurrir por funciones SECURITY DEFINER.
revoke all on table public.producto_interaccion_guardas from anon, authenticated;
revoke all on table public.producto_interacciones from anon, authenticated;
revoke all on table public.producto_popularidad_diaria from anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'producto_interaccion_guardas'
      and policyname = 'producto_interaccion_guardas_no_direct_access'
  ) then
    create policy producto_interaccion_guardas_no_direct_access
    on public.producto_interaccion_guardas
    for all
    to anon, authenticated
    using (false)
    with check (false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'producto_interacciones'
      and policyname = 'producto_interacciones_no_direct_access'
  ) then
    create policy producto_interacciones_no_direct_access
    on public.producto_interacciones
    for all
    to anon, authenticated
    using (false)
    with check (false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'producto_popularidad_diaria'
      and policyname = 'producto_popularidad_diaria_no_direct_access'
  ) then
    create policy producto_popularidad_diaria_no_direct_access
    on public.producto_popularidad_diaria
    for all
    to anon, authenticated
    using (false)
    with check (false);
  end if;
end $$;

create or replace function public._bucket_by_minutes(ts timestamptz, minutes_window integer)
returns timestamptz
language sql
immutable
as $$
  select to_timestamp(
    floor(extract(epoch from ts) / greatest(1, minutes_window * 60)) * greatest(1, minutes_window * 60)
  );
$$;

create or replace function public.record_product_interaction(
  p_producto_id uuid,
  p_event_type text,
  p_device_id text default null,
  p_session_id text default null,
  p_click_action text default null,
  p_event_time timestamptz default now(),
  p_view_dedupe_minutes integer default 30,
  p_clicks_per_minute integer default 6,
  p_favorite_dedupe_hours integer default 24
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id text;
  v_now timestamptz := coalesce(p_event_time, now());
  v_bucket timestamptz;
  v_rowcount integer := 0;
begin
  if p_producto_id is null then
    return false;
  end if;

  if p_event_type not in ('view', 'click', 'favorite') then
    return false;
  end if;

  v_actor_id := coalesce(nullif(trim(p_device_id), ''), nullif(trim(p_session_id), ''));
  if v_actor_id is null then
    return false;
  end if;

  if p_event_type = 'view' then
    v_bucket := public._bucket_by_minutes(v_now, greatest(1, p_view_dedupe_minutes));

    insert into public.producto_interaccion_guardas (producto_id, tipo_evento, actor_id, bucket_inicio, conteo)
    values (p_producto_id, 'view', v_actor_id, v_bucket, 1)
    on conflict do nothing;

    get diagnostics v_rowcount = row_count;
    if v_rowcount = 0 then
      return false;
    end if;

  elsif p_event_type = 'click' then
    v_bucket := date_trunc('minute', v_now);

    insert into public.producto_interaccion_guardas (producto_id, tipo_evento, actor_id, bucket_inicio, conteo)
    values (p_producto_id, 'click', v_actor_id, v_bucket, 1)
    on conflict (producto_id, tipo_evento, actor_id, bucket_inicio)
    do update
      set conteo = public.producto_interaccion_guardas.conteo + 1,
          actualizado_en = now()
      where public.producto_interaccion_guardas.conteo < greatest(1, p_clicks_per_minute);

    get diagnostics v_rowcount = row_count;
    if v_rowcount = 0 then
      return false;
    end if;

  elsif p_event_type = 'favorite' then
    v_bucket := public._bucket_by_minutes(v_now, greatest(1, p_favorite_dedupe_hours * 60));

    insert into public.producto_interaccion_guardas (producto_id, tipo_evento, actor_id, bucket_inicio, conteo)
    values (p_producto_id, 'favorite', v_actor_id, v_bucket, 1)
    on conflict do nothing;

    get diagnostics v_rowcount = row_count;
    if v_rowcount = 0 then
      return false;
    end if;
  end if;

  insert into public.producto_interacciones (producto_id, tipo_evento, accion_click, actor_id, ocurrido_en)
  values (p_producto_id, p_event_type, nullif(trim(p_click_action), ''), v_actor_id, v_now);

  insert into public.producto_popularidad_diaria (
    producto_id,
    dia,
    vistas,
    clicks,
    favoritos,
    actualizado_en
  )
  values (
    p_producto_id,
    (v_now at time zone 'utc')::date,
    case when p_event_type = 'view' then 1 else 0 end,
    case when p_event_type = 'click' then 1 else 0 end,
    case when p_event_type = 'favorite' then 1 else 0 end,
    now()
  )
  on conflict (producto_id, dia)
  do update set
    vistas = public.producto_popularidad_diaria.vistas + excluded.vistas,
    clicks = public.producto_popularidad_diaria.clicks + excluded.clicks,
    favoritos = public.producto_popularidad_diaria.favoritos + excluded.favoritos,
    actualizado_en = now();

  return true;
end;
$$;

revoke all on function public.record_product_interaction(uuid, text, text, text, text, timestamptz, integer, integer, integer) from public;
grant execute on function public.record_product_interaction(uuid, text, text, text, text, timestamptz, integer, integer, integer) to anon, authenticated;

create or replace function public.get_product_popularity_30d(
  p_product_ids uuid[] default null
)
returns table (
  producto_id uuid,
  views_30d integer,
  clicks_30d integer,
  favs_30d integer,
  score numeric
)
language sql
security definer
set search_path = public
as $$
  with weights as (
    select peso_view, peso_click, peso_favorite
    from public.catalogo_popular_pesos
    where id = true
    limit 1
  ),
  base_products as (
    select p.id as producto_id, p.creado_en
    from public.productos p
    where p.activo = true
      and (p_product_ids is null or p.id = any (p_product_ids))
  ),
  agg as (
    select
      d.producto_id,
      coalesce(sum(d.vistas), 0)::integer as views_30d,
      coalesce(sum(d.clicks), 0)::integer as clicks_30d,
      coalesce(sum(d.favoritos), 0)::integer as favs_30d
    from public.producto_popularidad_diaria d
    where d.dia >= (current_date - interval '29 day')
    group by d.producto_id
  )
  select
    bp.producto_id,
    coalesce(a.views_30d, 0) as views_30d,
    coalesce(a.clicks_30d, 0) as clicks_30d,
    coalesce(a.favs_30d, 0) as favs_30d,
    (
      coalesce(a.views_30d, 0) * coalesce(w.peso_view, 1)
      + coalesce(a.clicks_30d, 0) * coalesce(w.peso_click, 2)
      + coalesce(a.favs_30d, 0) * coalesce(w.peso_favorite, 3)
    )::numeric as score
  from base_products bp
  left join agg a on a.producto_id = bp.producto_id
  cross join weights w
  order by score desc, bp.creado_en desc;
$$;

revoke all on function public.get_product_popularity_30d(uuid[]) from public;
grant execute on function public.get_product_popularity_30d(uuid[]) to anon, authenticated;
