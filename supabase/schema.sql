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
  drink_capacity text,                      -- [web] 주량 (평문, 최대 30자)
  meetup_available text,                     -- [web] 벙참가능유무 (평문, 최대 30자)
  meetup_time text,                          -- [web] 벙참가능시간 (평문, 최대 30자)
  self_style text,                           -- [web] 본인 스타일 (평문, 최대 30자)
  ideal_type text,                           -- [web] 이상형 (평문, 최대 30자)
  status_msg text,                           -- [web] 현 상태 (평문, 최대 30자)
  blood_type text,                           -- [web] 혈액형 (평문, 최대 30자)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,  -- [web] 경고 대상
  reason text not null,                                          -- [web] 경고 사유
  warned_by text references users(id),                           -- [web] 경고자
  created_at timestamptz default now()                           -- [web] 경고일자
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
