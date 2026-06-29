-- Run this in the Supabase SQL Editor.
-- 이 앱은 Supabase Auth 를 쓰지 않아 모든 요청이 anon 역할로 나갑니다.
-- 그래서 Storage(storage.objects)의 기본 RLS 에 막혀 업로드가 실패합니다.
-- 아래 정책으로 지정한 버킷에 한해 익명 업로드/조회/수정/삭제를 허용합니다.

-- 1) 버킷이 없으면 생성 + public 읽기 가능하도록 설정
insert into storage.buckets (id, name, public)
values
  ('command-images', 'command-images', true),
  ('welcome-images', 'welcome-images', true)
on conflict (id) do update set public = true;

-- 2) 해당 버킷에 대한 익명 접근 정책
--    (storage.objects 의 RLS 는 Supabase 가 이미 켜둔 상태)

create policy "public read app images"
  on storage.objects for select
  using (bucket_id in ('command-images', 'welcome-images'));

create policy "anon insert app images"
  on storage.objects for insert
  with check (bucket_id in ('command-images', 'welcome-images'));

create policy "anon update app images"
  on storage.objects for update
  using (bucket_id in ('command-images', 'welcome-images'))
  with check (bucket_id in ('command-images', 'welcome-images'));

create policy "anon delete app images"
  on storage.objects for delete
  using (bucket_id in ('command-images', 'welcome-images'));
