
-- 1) Extensión necesaria para UUIDs
create extension if not exists "pgcrypto";

-- 2) Tablas
create table if not exists public.political_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  organization text,
  source text not null default 'web',
  created_at timestamptz not null default now()
);
alter table public.political_contacts enable row level security;

create table if not exists public.industry_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'web',
  created_at timestamptz not null default now()
);
alter table public.industry_subscriptions enable row level security;

-- 3) Índice único por email (case-insensitive) en suscripciones
create unique index if not exists industry_subscriptions_email_unique
  on public.industry_subscriptions (lower(email));

-- 4) Políticas RLS (idempotentes)

-- INSERT para visitantes anónimos (formularios públicos)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'political_contacts'
      and policyname = 'anon_insert_political_contacts'
  ) then
    create policy "anon_insert_political_contacts"
      on public.political_contacts
      for insert
      to anon
      with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'industry_subscriptions'
      and policyname = 'anon_insert_industry_subscriptions'
  ) then
    create policy "anon_insert_industry_subscriptions"
      on public.industry_subscriptions
      for insert
      to anon
      with check (true);
  end if;
end $$;

-- SELECT solo para usuarios autenticados (lecturas internas)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'political_contacts'
      and policyname = 'auth_read_political_contacts'
  ) then
    create policy "auth_read_political_contacts"
      on public.political_contacts
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'industry_subscriptions'
      and policyname = 'auth_read_industry_subscriptions'
  ) then
    create policy "auth_read_industry_subscriptions"
      on public.industry_subscriptions
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- 5) Verificación rápida del estado
-- Tablas existentes
select
  (select exists (select 1 from information_schema.tables where table_schema='public' and table_name='political_contacts')) as has_political_contacts,
  (select exists (select 1 from information_schema.tables where table_schema='public' and table_name='industry_subscriptions')) as has_industry_subscriptions;

-- Políticas actuales
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where tablename in ('political_contacts','industry_subscriptions')
order by tablename, policyname;
