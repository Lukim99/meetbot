# 모임봇 — 카카오톡 + 웹 유저/모임 관리 시스템

카카오톡 봇이 Supabase에 적재한 데이터(들낙/닉변/메시지 감지)를 조회·관리하는 웹 앱.
PC와 모바일(`/m/*`) 레이아웃을 라우트로 분리하고 페이지 컴포넌트는 공유한다.

## 스택

Vite + React 19 + TypeScript · Tailwind CSS v4 · react-router-dom · zustand · Supabase · lucide-react

상세 규약과 디자인 시스템은 [CLAUDE.md](./CLAUDE.md) 참고.

## 시작하기

```bash
npm install
```

1. Supabase 프로젝트 생성 후 [supabase/schema.sql](./supabase/schema.sql)을 SQL 에디터에서 실행.
2. Storage에 `welcome-images`, `command-images` 버킷을 public으로 생성.
3. `.env.local`에 키 입력:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev      # 개발 서버
npm run build    # 타입 체크 + 프로덕션 빌드
```

## 인증

웹은 Supabase Auth를 쓰지 않는 커스텀 방식이다.

- 이름으로 유저 조회 → 현재 User-Agent가 `logged_in_agent`에 있으면 즉시 로그인.
- 처음 보는 기기면 `code` 입력으로 인증하고 UA를 등록한다.
- 세션은 `sessionStorage`에 유지된다.

## 구조

```
src/
  lib/        supabase, auth, settlement, storage, format, cn
  store/      authStore (zustand)
  hooks/      useAuth, useUser, useIsMobile
  components/ layout/ (PC·Mobile·가드), ui/ (공통 컴포넌트)
  pages/      Login, Ranking, Members, MemberDetail, MbtiList,
              Profile, Meetings, MeetingDetail, admin/*
  router/     라우트 정의 (/m 분기)
```
