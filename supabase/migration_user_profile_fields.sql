-- Run this against your Supabase project after the initial schema.
-- Adds free-text profile fields each user can edit (max 30 chars, plain text).
-- MBTI already exists on the users table.

alter table users
  add column if not exists drink_capacity   text,  -- 주량
  add column if not exists meetup_available text,  -- 벙참가능유무
  add column if not exists meetup_time      text,  -- 벙참가능시간
  add column if not exists self_style       text,  -- 본인 스타일
  add column if not exists ideal_type       text,  -- 이상형
  add column if not exists status_msg       text,  -- 현 상태
  add column if not exists blood_type       text;  -- 혈액형

-- 각 필드 최대 30자 제한 (평문)
alter table users
  add constraint users_drink_capacity_len   check (drink_capacity   is null or char_length(drink_capacity)   <= 30) not valid,
  add constraint users_meetup_available_len check (meetup_available is null or char_length(meetup_available) <= 30) not valid,
  add constraint users_meetup_time_len      check (meetup_time      is null or char_length(meetup_time)      <= 30) not valid,
  add constraint users_self_style_len       check (self_style       is null or char_length(self_style)       <= 30) not valid,
  add constraint users_ideal_type_len       check (ideal_type       is null or char_length(ideal_type)       <= 30) not valid,
  add constraint users_status_msg_len       check (status_msg       is null or char_length(status_msg)       <= 30) not valid,
  add constraint users_blood_type_len       check (blood_type       is null or char_length(blood_type)       <= 30) not valid;
