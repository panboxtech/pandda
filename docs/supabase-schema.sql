-- Sugestão de esquema para Supabase (Postgres)
-- Ajuste conforme necessidades (tipos e constraints)

-- users (exemplo)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'comum', -- 'master' or 'comum'
  created_at timestamptz default now()
);

-- clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  due_date date,
  notified boolean default false,
  created_at timestamptz default now()
);

-- servers
create table if not exists servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  created_at timestamptz default now()
);

-- plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- apps
create table if not exists apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url_download text,
  created_at timestamptz default now()
);
