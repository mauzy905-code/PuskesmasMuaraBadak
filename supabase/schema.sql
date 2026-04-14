create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger trg_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  date date not null default current_date,
  excerpt text not null,
  content text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_announcements_updated_at
before update on public.announcements
for each row
execute function public.set_updated_at();

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  nik text not null,
  dob date not null,
  gender text not null,
  phone text not null,
  poli text not null,
  visit_date date not null,
  complaint text,
  created_at timestamptz not null default now()
);

create table if not exists public.queue_daily (
  date date primary key,
  current_number int not null default 0,
  updated_at timestamptz not null default now()
);

create trigger trg_queue_daily_updated_at
before update on public.queue_daily
for each row
execute function public.set_updated_at();

create table if not exists public.daily_services (
  date date primary key,
  doctors jsonb not null default '[]'::jsonb,
  note text,
  updated_at timestamptz not null default now()
);

create trigger trg_daily_services_updated_at
before update on public.daily_services
for each row
execute function public.set_updated_at();

create table if not exists public.feedbacks (
  id uuid default gen_random_uuid() primary key,
  name text default 'Anonim',
  phone text,
  category text not null,
  message text not null,
  rating integer check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
