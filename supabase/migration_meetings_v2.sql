-- Run this against your Supabase project after the initial schema.
-- Adds time range, capacity, deadline, and host to meetings.

alter table meetings
  add column if not exists start_time  timestamptz,
  add column if not exists end_time    timestamptz,
  add column if not exists min_members integer,
  add column if not exists max_members integer,
  add column if not exists deadline    timestamptz,
  add column if not exists host_id     text references users(id);

alter table meeting_members
  add column if not exists joined_at timestamptz default now();
