-- ============================================
-- GROUND UP — Supabase Schema
-- ============================================
-- Run this in the Supabase SQL editor
-- or via: supabase db push

-- Enable UUID extension
create extension if not exists "uuid-ossp";


-- ============================================
-- PROFILES
-- Extends Supabase auth.users
-- ============================================
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================
-- USER RIGS
-- Grinder + machine profile — set once
-- ============================================
create table public.user_rigs (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,

  -- Grinder
  grinder_brand     text,
  grinder_model     text,
  grinder_type      text check (grinder_type in ('flat_burr', 'conical_burr', 'blade', 'hand')),
  grinder_micron_min int,   -- lowest grind setting in microns (optional reference)
  grinder_micron_max int,

  -- Machine
  machine_brand     text,
  machine_model     text,
  machine_type      text check (machine_type in ('semi_auto', 'auto', 'super_auto', 'lever', 'manual', 'pour_over', 'aeropress', 'french_press', 'moka_pot')),

  -- Basket sizes (espresso)
  basket_sizes      int[],   -- e.g. [18, 20] grams

  -- Preferred methods
  preferred_methods text[],  -- e.g. ['espresso', 'pour_over']

  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null,

  unique (user_id)  -- one rig profile per user for now
);

alter table public.user_rigs enable row level security;

create policy "Users manage their own rig"
  on public.user_rigs for all
  using (auth.uid() = user_id);


-- ============================================
-- COFFEES
-- Core coffee record — the archive
-- ============================================
create table public.coffees (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,

  -- Identity (auto-pulled + user-confirmed)
  roaster_name        text not null,
  roaster_url         text,
  coffee_name         text not null,
  bag_photo_url       text,

  -- Origin
  origin_country      text,
  region              text,
  farm                text,
  varietal            text,
  process             text check (process in ('washed', 'natural', 'honey', 'anaerobic', 'wet_hulled', 'other')),

  -- Roast
  roast_date          date,
  roast_level         text check (roast_level in ('light', 'medium_light', 'medium', 'medium_dark', 'dark')),

  -- Status
  status              text default 'drinking' check (status in ('drinking', 'running_low', 'finished', 'want_to_try')),
  moment_tag          text check (moment_tag in ('morning', 'afternoon', 'evening', 'weekend')),

  -- Roaster flavor axes (auto-pulled from roaster page)
  roaster_acidity     numeric(4,1) check (roaster_acidity between 0 and 10),
  roaster_fruit       numeric(4,1) check (roaster_fruit between 0 and 10),
  roaster_body        numeric(4,1) check (roaster_body between 0 and 10),
  roaster_roast       numeric(4,1) check (roaster_roast between 0 and 10),
  roaster_sweetness   numeric(4,1) check (roaster_sweetness between 0 and 10),
  roaster_floral      numeric(4,1) check (roaster_floral between 0 and 10),
  roaster_finish      numeric(4,1) check (roaster_finish between 0 and 10),

  -- User flavor axes
  user_acidity        numeric(4,1) check (user_acidity between 0 and 10),
  user_fruit          numeric(4,1) check (user_fruit between 0 and 10),
  user_body           numeric(4,1) check (user_body between 0 and 10),
  user_roast          numeric(4,1) check (user_roast between 0 and 10),
  user_sweetness      numeric(4,1) check (user_sweetness between 0 and 10),
  user_floral         numeric(4,1) check (user_floral between 0 and 10),
  user_finish         numeric(4,1) check (user_finish between 0 and 10),

  -- Tasting
  roaster_taste_notes text[],   -- e.g. ['jasmine', 'red grape', 'lavender']
  user_taste_notes    text[],
  user_rating         numeric(3,1) check (user_rating between 0 and 10),
  user_notes          text,     -- long-form tasting notes
  is_favorite         boolean default false,

  -- Timestamps
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

alter table public.coffees enable row level security;

create policy "Users manage their own coffees"
  on public.coffees for all
  using (auth.uid() = user_id);

-- Indexes for common queries
create index coffees_user_id_idx on public.coffees(user_id);
create index coffees_status_idx on public.coffees(user_id, status);
create index coffees_favorite_idx on public.coffees(user_id, is_favorite);
create index coffees_created_at_idx on public.coffees(user_id, created_at desc);


-- ============================================
-- BREW LOGS
-- Individual brew sessions per coffee
-- ============================================
create table public.brew_logs (
  id                  uuid default uuid_generate_v4() primary key,
  coffee_id           uuid references public.coffees(id) on delete cascade not null,
  user_id             uuid references public.profiles(id) on delete cascade not null,

  -- Method
  brew_method         text not null check (brew_method in ('espresso', 'pour_over', 'aeropress', 'french_press', 'moka_pot', 'cold_brew', 'drip', 'other')),
  brew_date           date default current_date,

  -- Simple fields (always shown)
  dose_grams          numeric(5,1),   -- coffee in
  yield_grams         numeric(5,1),   -- liquid out
  ratio               numeric(5,2) generated always as (
                        case when dose_grams > 0 then yield_grams / dose_grams else null end
                      ) stored,

  -- Advanced fields (espresso)
  brew_time_sec       int,
  brew_temp_f         numeric(5,1),
  grind_setting       text,           -- e.g. "11 clicks" or "760µm"
  machine_model       text,
  line_pressure_bars  numeric(4,1),
  max_pressure_bars   numeric(4,1),

  -- Advanced fields (filter)
  water_grams         numeric(6,1),
  filter_type         text,           -- e.g. "Hario V60", "Kalita Wave"
  bloom_time_sec      int,

  -- Notes
  notes               text,
  rating              numeric(3,1) check (rating between 0 and 10),

  created_at          timestamptz default now() not null
);

alter table public.brew_logs enable row level security;

create policy "Users manage their own brew logs"
  on public.brew_logs for all
  using (auth.uid() = user_id);

create index brew_logs_coffee_id_idx on public.brew_logs(coffee_id);
create index brew_logs_user_id_idx on public.brew_logs(user_id, brew_date desc);


-- ============================================
-- UPDATED_AT TRIGGERS
-- Auto-update updated_at on row changes
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger coffees_updated_at
  before update on public.coffees
  for each row execute procedure public.handle_updated_at();

create trigger user_rigs_updated_at
  before update on public.user_rigs
  for each row execute procedure public.handle_updated_at();


-- ============================================
-- SEED DATA (dev only — remove before prod)
-- ============================================

-- Insert via auth.users first in real usage.
-- This seed assumes a test user with known UUID exists.

-- Sample coffee for development
-- insert into public.coffees (
--   user_id, roaster_name, coffee_name, origin_country, process,
--   roaster_acidity, roaster_fruit, roaster_body, roaster_roast, roaster_sweetness, roaster_floral, roaster_finish,
--   user_acidity, user_fruit, user_body, user_roast, user_sweetness, user_floral, user_finish,
--   roaster_taste_notes, user_taste_notes, user_rating, status, moment_tag
-- ) values (
--   'YOUR_TEST_USER_UUID',
--   'Savage Coffees', 'Panama Gesha Natural', 'Panama', 'natural',
--   8.5, 9.0, 6.5, 2.0, 8.0, 9.5, 8.0,
--   8.0, 9.5, 7.0, 1.5, 7.5, 8.5, 8.5,
--   array['jasmine', 'lavender', 'red grape'],
--   array['lychee', 'bergamot', 'honey dew'],
--   9.2, 'drinking', 'morning'
-- );
