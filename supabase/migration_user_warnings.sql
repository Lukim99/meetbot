-- Run this against your Supabase project after the initial schema.
-- Per-user warning system: who warned, reason, when. 경고 횟수 = 행 개수.
-- 경고 권한은 permission 에 1(owner) 또는 2(admin) 가 포함된 유저.

create table if not exists user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,  -- 경고 대상
  reason text not null,                                          -- 경고 사유
  warned_by text references users(id),                           -- 경고자
  created_at timestamptz default now()                           -- 경고일자
);

create index if not exists user_warnings_user_id_idx on user_warnings (user_id);
create index if not exists user_warnings_created_at_idx on user_warnings (created_at desc);
