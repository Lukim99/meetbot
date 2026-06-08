-- Supabase schema for the KakaoTalk + Web user/meeting management system.
-- Run in the Supabase dashboard SQL editor.

create table if not exists users (
  id text primary key,
  name text not null,
  code text not null,
  logged_in text[] default '{}',
  logged_in_agent text[] default '{}',
  birthday text default '',                 -- "YYMMDD"
  chat_count integer default 0,
  logs jsonb default '{"entry":[],"exit":[],"change_name":[]}',
  permission integer[] default '{}',        -- 0 = admin
  titles text[] default '{}',
  title text default '',
  mbti text,                                -- [web] 16 types or null
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  description text,
  created_by text references users(id),
  settled boolean default false,           -- [web] settlement done flag
  created_at timestamptz default now()
);

create table if not exists meeting_members (
  meeting_id uuid references meetings(id) on delete cascade,
  user_id text references users(id),
  primary key (meeting_id, user_id)
);

create table if not exists meeting_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  label text not null,
  amount integer not null,
  payer_id text references users(id)        -- null = split equally (1/N)
);

create table if not exists commands (
  id uuid primary key default gen_random_uuid(),
  trigger text not null unique,
  response_text text,
  image_url text
);

create table if not exists welcome_message (
  id integer primary key default 1,
  text text,
  image_url text
);

insert into storage.buckets (id, name, public) values ('welcome-images', 'welcome-images', true);
insert into storage.buckets (id, name, public) values ('command-images', 'command-images', true);
