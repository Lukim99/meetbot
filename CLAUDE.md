# CLAUDE.md — KakaoTalk + Web User/Meeting Management System

## Project Purpose

A web application that surfaces data collected by a KakaoTalk bot (entry/exit events, nickname changes, message counts) stored in Supabase. The web app lets users view stats and manage their profiles, and lets admins manage welcome messages, auto-reply commands, and group settlements.

**KakaoTalk bot is out of scope.** It writes to Supabase; this app only reads/writes via the Supabase JS client.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite 8 + React 19 + TypeScript 6 | already scaffolded |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first config, no tailwind.config.js |
| Routing | `react-router-dom` v7 | `/m/*` for mobile, bare paths for PC |
| State | `zustand` | auth store only |
| Backend | `@supabase/supabase-js` v2 | Supabase hosted |
| Icons | `lucide-react` | consistent icon set |
| React Compiler | already enabled via babel preset | keep as-is |

**Install command (run once):**
```
npm install react-router-dom @supabase/supabase-js zustand lucide-react
npm install -D @tailwindcss/vite
```

**vite.config.ts** — add `@tailwindcss/vite` plugin:
```ts
import tailwindcss from '@tailwindcss/vite'
// add tailwindcss() to plugins array alongside existing react() and babel()
```

**src/index.css** — Tailwind v4 entry (replaces existing content):
```css
@import "tailwindcss";

@theme {
  --color-accent: #00FFBF;
  --color-accent-dim: #00cc99;
  --color-bg: #0f0f0f;
  --color-surface: #1a1a1a;
  --color-surface-2: #242424;
  --color-border: #2e2e2e;
  --color-text: #f0f0f0;
  --color-text-muted: #888888;
}
```

---

## Design System

### Colors (always use these CSS variables or Tailwind class equivalents)

| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#00FFBF` | primary buttons, active states, badges, highlights |
| `--color-accent-dim` | `#00cc99` | hover state of accent |
| `--color-bg` | `#0f0f0f` | page background |
| `--color-surface` | `#1a1a1a` | cards, sidebar, modals |
| `--color-surface-2` | `#242424` | inputs, table rows, nested surfaces |
| `--color-border` | `#2e2e2e` | all borders and dividers |
| `--color-text` | `#f0f0f0` | primary text |
| `--color-text-muted` | `#888888` | secondary text, labels, placeholders |

**Rule:** dark background (#0f0f0f) everywhere. No light mode. Accent (#00FFBF) is the only vivid color — use it sparingly for emphasis.

### Typography
- Font: system-ui / `-apple-system` stack (no external fonts)
- Base size: 14px (Tailwind `text-sm`)
- Headings: `text-lg font-semibold` for page titles, `text-base font-medium` for section titles
- Muted labels: `text-xs text-[--color-text-muted]`

### Spacing & Shape
- Card border radius: `rounded-xl` (12px)
- Input/button border radius: `rounded-lg` (8px)
- Consistent padding inside cards: `p-4` or `p-5`
- Sidebar width (PC): `w-56` (224px), collapsed: `w-14`

### Icons & Emoji

**Use icons, not emoji.** A clean, modern, refined look comes from a consistent monochrome icon set — never from emoji.

- All icons come from `lucide-react`. One library, one visual language.
- Default icon size: `size={18}` inline with text, `size={20}` for nav/standalone, `size={16}` for dense tables/badges.
- Icon color follows text: `text-[--color-text-muted]` by default, `text-[--color-accent]` when active/emphasized. Do not give icons their own colors.
- **Do not use emoji anywhere in the UI chrome** — no 🥇🎉✅⚠️🔥 in buttons, headers, labels, badges, toasts, or empty states. Replace each with a lucide icon:
  - rank/medal → `Medal`, `Crown`, `Trophy` (or a styled numeric badge — see Ranking spec)
  - success → `Check` / `CheckCircle2`
  - warning/error → `AlertTriangle` / `XCircle`
  - celebration → omit entirely; use a `Sparkles` icon only if truly needed
  - empty state → a single muted lucide icon (e.g. `Inbox`, `SearchX`) above the message
- The only place emoji may appear is **user-authored content** stored in the DB (a user's nickname, a welcome message an admin typed). Never inject emoji ourselves.
- Icons must always be paired with a text label or an `aria-label` — never an icon alone with no accessible name.

### Component Patterns (implement in `src/components/ui/`)

Every UI primitive must follow these exact patterns. Do not deviate.

**Button:**
- Variant `primary`: `bg-[--color-accent] text-black font-semibold hover:bg-[--color-accent-dim]`
- Variant `ghost`: `bg-transparent border border-[--color-border] text-[--color-text] hover:bg-[--color-surface-2]`
- Variant `danger`: `bg-transparent border border-red-800 text-red-400 hover:bg-red-900/20`
- All buttons: `rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer`

**Input:**
- `bg-[--color-surface-2] border border-[--color-border] rounded-lg px-3 py-2 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent] transition-colors w-full`

**Card:**
- `bg-[--color-surface] border border-[--color-border] rounded-xl p-5`

**Badge:**
- Accent: `bg-[--color-accent]/10 text-[--color-accent] border border-[--color-accent]/20 rounded-full px-2 py-0.5 text-xs font-medium`
- Neutral: `bg-[--color-surface-2] text-[--color-text-muted] rounded-full px-2 py-0.5 text-xs`

**Table:**
- `w-full text-sm` with `thead` using `text-[--color-text-muted] text-xs uppercase border-b border-[--color-border]`
- `tbody tr` with `border-b border-[--color-border] hover:bg-[--color-surface-2] transition-colors`
- `td/th` padding: `px-4 py-3`

---

## Directory Structure

```
src/
├── lib/
│   ├── supabase.ts       # Supabase client singleton
│   └── auth.ts           # login(), logout(), checkUA() helpers
├── store/
│   └── authStore.ts      # zustand store: { user, setUser, clear }
├── types/
│   └── index.ts          # All TypeScript types
├── hooks/
│   ├── useAuth.ts        # reads authStore, exposes isAdmin
│   ├── useUser.ts        # fetch single user by id
│   └── useIsMobile.ts    # reads LayoutContext; true under /m/* layout
├── components/
│   ├── layout/
│   │   ├── PCLayout.tsx      # sidebar + topbar wrapper
│   │   ├── MobileLayout.tsx  # bottom tab bar wrapper
│   │   └── RequireAuth.tsx   # redirect to /login if not authed
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── Table.tsx
├── pages/
│   ├── Login.tsx
│   ├── Ranking.tsx
│   ├── Members.tsx
│   ├── MemberDetail.tsx
│   ├── MbtiList.tsx
│   ├── Profile.tsx
│   ├── Meetings.tsx
│   ├── MeetingDetail.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── WelcomeMsg.tsx
│       ├── Commands.tsx
│       └── Settlements.tsx
└── router/
    └── index.tsx         # all routes defined here
```

---

## TypeScript Types (`src/types/index.ts`)

```ts
export interface LogEntry {
  date: string        // ISO string, KST
  name: string
}

export interface LogExit {
  date: string
  name: string
  cause: '나가기' | '강퇴'
  kicked_by: string | null
}

export interface LogChangeName {
  date: string
  old_name: string
  new_name: string
}

export interface UserLogs {
  entry: LogEntry[]
  exit: LogExit[]
  change_name: LogChangeName[]
}

export interface User {
  id: string
  name: string
  code: string
  logged_in: string[]
  logged_in_agent: string[]
  birthday: string          // format: "YYMMDD", e.g. "041006"
  chat_count: number
  logs: UserLogs
  permission: number[]      // permission IDs; admin if includes 0 (define constant)
  titles: string[]          // all nicknames
  title: string             // current active nickname
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  name: string
  date: string              // ISO date
  description: string | null
  created_by: string        // user id
  created_at: string
}

export interface MeetingMember {
  meeting_id: string
  user_id: string
}

export interface MeetingItem {
  id: string
  meeting_id: string
  label: string
  amount: number
  payer_id: string | null   // null = split equally among all members
}

export interface Command {
  id: string
  trigger: string
  response_text: string | null
  image_url: string | null
}

export interface WelcomeMessage {
  id: string
  text: string | null
  image_url: string | null
}

// Permission constants
export const PERM_ADMIN = 0
```

---

## Supabase Schema

Tables to create in Supabase dashboard:

```sql
-- users table mirrors the KakaoTalk bot's schema exactly
create table users (
  id text primary key,
  name text not null,
  code text not null,
  logged_in text[] default '{}',
  logged_in_agent text[] default '{}',
  birthday text default '',
  chat_count integer default 0,
  logs jsonb default '{"entry":[],"exit":[],"change_name":[]}',
  permission integer[] default '{}',
  titles text[] default '{}',
  title text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  description text,
  created_by text references users(id),
  created_at timestamptz default now()
);

create table meeting_members (
  meeting_id uuid references meetings(id) on delete cascade,
  user_id text references users(id),
  primary key (meeting_id, user_id)
);

create table meeting_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  label text not null,
  amount integer not null,
  payer_id text references users(id)
);

create table commands (
  id uuid primary key default gen_random_uuid(),
  trigger text not null unique,
  response_text text,
  image_url text
);

create table welcome_message (
  id integer primary key default 1,
  text text,
  image_url text
);
```

**Supabase client (`src/lib/supabase.ts`):**
```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)
```

Env vars go in `.env.local`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## Auth Flow

**Login logic (`src/lib/auth.ts`):**

```
login(name: string, code?: string) → User | AuthError

1. Query users table WHERE name = $name (exact match)
2. If no user found → throw "유저를 찾을 수 없습니다"
3. Get current navigator.userAgent
4. If user.logged_in_agent includes current UA → login success (no code needed)
5. Else if code is not provided → throw { needCode: true }
6. Else if code !== user.code → throw "코드가 올바르지 않습니다"
7. Else → append UA to logged_in_agent via supabase UPDATE → login success
8. On success: save user to zustand authStore, save user.id to sessionStorage
```

**Session persistence:** On app load, read `sessionStorage.getItem('uid')`, re-fetch user from Supabase, restore authStore. If fetch fails, clear and redirect to login.

**Admin check:** `user.permission.includes(PERM_ADMIN)` (PERM_ADMIN = 0)

**RequireAuth component:** wraps protected routes. If `!authStore.user`, redirect to the appropriate login path (`/login` or `/m/login` based on current path prefix).

---

## Routing (`src/router/index.tsx`)

Use `createBrowserRouter`. Structure:

```
/ → redirect to /ranking (or /m/ranking if on mobile)
/login → Login (no layout)
/m/login → Login (no layout, mobile flag)

PC routes (wrapped in PCLayout > RequireAuth):
  /ranking
  /members
  /members/:id
  /mbti
  /profile
  /meetings
  /meetings/:id
  /admin              (RequireAdmin guard)
  /admin/welcome      (RequireAdmin)
  /admin/commands     (RequireAdmin)
  /admin/settlements  (RequireAdmin)

Mobile routes (wrapped in MobileLayout > RequireAuth):
  /m/ranking
  /m/members
  /m/members/:id
  /m/mbti
  /m/profile
  /m/meetings
  /m/meetings/:id
  /m/admin            (RequireAdmin)
  /m/admin/welcome    (RequireAdmin)
  /m/admin/commands   (RequireAdmin)
  /m/admin/settlements (RequireAdmin)
```

PC and mobile pages share the same page component — the layout differs, not the content.

**Auto-detect mobile:** On the root `/` redirect, check `window.innerWidth < 768` or `navigator.userAgent` to redirect to `/m/ranking` vs `/ranking`.

---

## Layout Components

Both layouts wrap their `<Outlet />` in a `LayoutContext.Provider` that exposes `{ isMobile }` — `PCLayout` provides `false`, `MobileLayout` provides `true`. Pages read it via `useIsMobile()`. This is how a shared page renders a table on PC and a card list on mobile without re-detecting width.

### PCLayout (`src/components/layout/PCLayout.tsx`)

```
┌────────────────────────────────────────────┐
│ Sidebar (w-56) │ Topbar (h-14)             │
│  Logo (#00FFBF)│ Page title   | User badge │
│  ─────────────│───────────────────────────│
│  Nav items     │                           │
│  (icon + text) │   <Outlet />              │
│  ─────────────│                           │
│  [Admin menu]  │                           │
│  (if isAdmin)  │                           │
└────────────────────────────────────────────┘
```

- Sidebar background: `bg-[--color-surface]`, right border: `border-r border-[--color-border]`
- Active nav item: left accent bar `border-l-2 border-[--color-accent]` + `text-[--color-accent]`
- Topbar: `bg-[--color-bg] border-b border-[--color-border]`

Nav items (PC):
- 랭킹 (`Trophy` icon) → `/ranking`
- 멤버 (`Users` icon) → `/members`
- MBTI (`LayoutGrid` icon) → `/mbti`
- 모임 (`CalendarDays` icon) → `/meetings`
- 내 프로필 (`User` icon) → `/profile`
- ─── (divider, admin only below) ───
- 관리 (`ShieldCheck` icon) → `/admin`

### MobileLayout (`src/components/layout/MobileLayout.tsx`)

```
┌─────────────────────────────┐
│     <Outlet />              │  (scrollable content area)
├─────────────────────────────┤
│ 랭킹 │ 멤버 │ MBTI │ 모임 │ 나  │  bottom tab bar (h-16)
└─────────────────────────────┘
```

- Tab bar: `bg-[--color-surface] border-t border-[--color-border]`
- Active tab: icon + label in `text-[--color-accent]`, inactive: `text-[--color-text-muted]`
- If isAdmin: add `ShieldCheck` tab that goes to `/m/admin`

---

## Responsive Layout

PC and mobile are split by route (`/m/*`) and wrapped in different layouts, but the **page components are shared**. A shared page adapts in two ways:

1. **Tailwind responsive utilities** for spacing/columns (the default).
2. **An `isMobile` flag** for cases where the markup must differ structurally (table vs. card list). Expose it via a tiny `useIsMobile()` hook that reads the route prefix (`/m/`) — do not re-detect by width inside pages. The layout already knows which it is; pass it down through a `LayoutContext` and read it with `useIsMobile()`.

### PC — use the full width

The screen is wide; do not waste it with a narrow centered column.

- Content area fills the space next to the sidebar — **no fixed `max-w-*` cap** on list/table/dashboard pages. Use `w-full` with comfortable page padding (`px-8 py-6`).
- Prefer multi-column grids that scale with width:
  - Card lists (Members, Meetings): `grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
  - Dashboard stat cards: `grid grid-cols-2 xl:grid-cols-4 gap-4`
  - MBTI buckets: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Tables span the full width (`w-full`); let flexible columns (name, title) take remaining space, keep numeric columns (chat count) narrow and right-aligned.
- The **only** place a narrow column is correct is a focused form (Login, the Profile edit form) — cap those at `max-w-md` / `max-w-lg` and center them. Everything else goes wide.

### Mobile — nothing breaks, nothing overflows

- **Never horizontal-scroll the page.** The body is single-column. Replace wide tables with a card/list per row (use `isMobile`); the Ranking and Members tables become stacked cards on mobile.
- Page padding `px-4`; cards go full width (`w-full`), stacked vertically (`flex flex-col gap-3`).
- **Text never breaks the layout:** long names/nicknames use `truncate` (single line) or `break-words` (wrapping blocks). Any flex row holding text needs `min-w-0` on the text child so `truncate` actually works.
- **Buttons:** primary actions are full-width (`w-full`) on mobile; never let a button label wrap to two lines — keep labels short. Icon-only buttons keep a min touch target of 44×44px (`min-h-11 min-w-11`).
- Filter/chip rows (MBTI filter, tabs) that can exceed the width scroll **horizontally inside their own container** (`flex overflow-x-auto`), not the page. Add `shrink-0` to each chip.
- Bottom tab bar is `fixed bottom-0`; give the scrollable content `pb-20` so the last item isn't hidden behind it. Respect the safe area: `pb-[env(safe-area-inset-bottom)]` on the tab bar.
- Modals on mobile: full-width with side margin (`mx-4`), `max-h-[85vh] overflow-y-auto` so long forms scroll inside the modal.
- Tap targets (nav items, list rows, chips) are at least 44px tall.

### Shared rules

- Use `min-w-0` liberally on flex children that contain text — this is the #1 cause of overflow.
- Images are always `max-w-full h-auto` (welcome-message preview, command images).
- Test every page at 360px (mobile) and 1440px (PC) widths before considering it done.

---

## Page Specifications

### Login (`/login`, `/m/login`)

State machine:
- `step: 'name' | 'code'`
- Initially show name input + submit button
- On submit: call `login(name)` → if `needCode` error, transition to `step: 'code'`
- In code step: show name (readonly, smaller) + code input
- On code submit: call `login(name, code)`
- Loading state: disable inputs, show spinner inside button
- Error: red text below the relevant input

UI: centered card on full-page dark background. Logo/title at top. No sidebar.

---

### Ranking (`/ranking`, `/m/ranking`)

Data: `SELECT id, name, title, chat_count FROM users ORDER BY chat_count DESC`

Display (no emoji — use a `RankBadge` component):
- Rank 1–3: lucide `Medal` icon inside a circular badge, colored by rank — gold `#FFD700`, silver `#C0C0C0`, bronze `#CD7F32`. Rank 1 row gets a faint accent background (`bg-[--color-accent]/5`).
- Rank 4+: the plain rank number in `text-[--color-text-muted]`, centered in the same badge footprint so columns stay aligned.
- Columns: 순위 | 이름 | 별명 | 채팅 수
- Clicking a row navigates to `/members/:id`

Mobile: card list instead of table (each card shows the same `RankBadge` + name + count). See Responsive Layout for the table→card rule.

---

### Members (`/members`, `/m/members`)

Data: `SELECT id, name, title, titles, birthday FROM users ORDER BY name`

UI:
- Search input at top (filter by name or any value in `titles`)
- MBTI filter chips row: `ALL` + 16 MBTI types. Clicking filters the list client-side.
  - Active chip: accent background
  - MBTI stored in `titles` array? **No** — MBTI is NOT currently in the schema. This needs clarification.
  
> **NOTE:** The `User` schema does not have an `mbti` field. MBTI must be added to Supabase `users` table as `mbti text` column. Add it to the TypeScript type as `mbti: string | null`.

- Card per user: name (bold), title (muted), MBTI badge, birthday (formatted: `YYMMDD` → `MM/DD`)
- Clicking card → `/members/:id`

---

### MemberDetail (`/members/:id`, `/m/members/:id`)

Data: full `users` row by id

Layout:
```
┌──────────────────────────────────┐
│  [Avatar: initials circle]       │
│  Name (large)  Title badge       │
│  MBTI badge   Birthday   채팅수   │
└──────────────────────────────────┘
┌──[ 입장/퇴장 | 닉변 이력 | 통계 ]──┐
│  Tab content                     │
└──────────────────────────────────┘
```

Tab 1 — 입장/퇴장:
- Merged and sorted by date (newest first)
- Entry rows: green left border, `user.logs.entry`
- Exit rows: red left border, `user.logs.exit`
  - If `cause === '강퇴'`: show `kicked_by` user name (fetch separately)

Tab 2 — 닉변 이력:
- `user.logs.change_name` sorted newest first
- `old_name → new_name` with date

Tab 3 — 통계:
- 총 채팅 수, 입장 횟수, 퇴장 횟수, 강퇴 횟수
- Simple stat cards grid

Avatar: circle with first character of name, `bg-[--color-accent]/20 text-[--color-accent]`

---

### MbtiList (`/mbti`, `/m/mbti`)

Data: all users with `mbti` field

Group users into 16 MBTI buckets. For each bucket:
```
┌─ INFJ (3) ──────────────────┐
│  [김철수] [이영희] [박민준]  │
└──────────────────────────────┘
```

- Bucket header: MBTI type in accent color + count badge
- User avatars: small circles (32px) with initials, clicking navigates to `/members/:id`
- Users with `mbti = null` go into a `미설정` bucket at the bottom

MBTI type ordering: INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP

---

### Profile (`/profile`, `/m/profile`)

Data: current user from authStore (re-fetch on mount to get fresh data)

Editable fields:
- **MBTI**: dropdown of 16 types + `없음`
- **Birthday**: text input, placeholder `YYMMDD` (e.g. `041006`)
- **별명(titles)**: tag input
  - Show existing titles as removable chips (×)
  - Text input with Enter/comma to add new title
  - Cannot remove the currently active `title` unless another is set first
- **대표 별명(title)**: dropdown of current `titles` array

Save: UPDATE users SET mbti=..., birthday=..., titles=..., title=... WHERE id=...

Non-editable display: name, 채팅 수, 가입일(created_at)

---

### Meetings (`/meetings`, `/m/meetings`)

Data: `SELECT * FROM meetings ORDER BY date DESC` + member count per meeting

- Card list: meeting name, date, `N명 참여`, description excerpt
- Clicking card → `/meetings/:id`
- `+ 모임 만들기` button → opens modal
  - Modal fields: 이름 (required), 날짜 (date picker, required), 설명 (textarea, optional)
  - On submit: INSERT into meetings, INSERT current user into meeting_members

---

### MeetingDetail (`/meetings/:id`, `/m/meetings/:id`)

Data: meeting row + meeting_members (with user names) + meeting_items

Layout:
```
Meeting title / date / description

Members section:
  [Avatar] 김철수  [Avatar] 이영희  ...
  [+ 멤버 추가] button → user search modal

Settlement section:
  Items list: label | amount | payer
  [+ 항목 추가] button → inline form row
  
  Settlement summary:
    1인당 N원 (if equal split)
    Breakdown: 누가 누구에게 얼마
```

Settlement calculation:
- Items with `payer_id = null`: cost split equally among all members
- Items with `payer_id`: that person pays, others owe their share
- Final summary: for each member, compute net balance → simplify to minimum transactions

Display results as: `[이름] → [이름]: [금액]원`

---

### AdminDashboard (`/admin`, `/m/admin`)

Stat cards (2×2 grid):
- 총 유저 수: `SELECT count(*) FROM users`
- 오늘 입장: count entries in `logs->entry` where date is today (KST)
- 총 채팅 수: `SELECT sum(chat_count) FROM users`
- 전체 모임 수: `SELECT count(*) FROM meetings`

Quick nav cards:
- 입장 메시지 설정 → `/admin/welcome`
- 명령어 관리 → `/admin/commands`
- 모임 정산 → `/admin/settlements`

---

### WelcomeMsg (`/admin/welcome`, `/m/admin/welcome`)

Data: `SELECT * FROM welcome_message WHERE id = 1`

Form:
- Textarea for `text`
- Image upload button → upload to Supabase Storage bucket `welcome-images` → save public URL to `image_url`
- Image preview below upload
- `저장` button → UPSERT welcome_message

---

### Commands (`/admin/commands`, `/m/admin/commands`)

Data: `SELECT * FROM commands ORDER BY trigger`

Table: 트리거 | 응답 텍스트 | 이미지 | 액션(수정/삭제)

- `+ 명령어 추가` button → opens modal
  - Fields: trigger (required), response_text (textarea), image upload
- Edit: same modal pre-filled
- Delete: confirm dialog before DELETE

---

### Settlements (`/admin/settlements`, `/m/admin/settlements`)

Data: all meetings with their items and member count

Table: 모임 이름 | 날짜 | 인원 | 총액 | 상태

- Status column: `미정산` (orange badge) vs `정산완료` (green badge)
- Meetings table needs a `settled boolean default false` column
- Toggle settled: UPDATE meetings SET settled = true/false
- Clicking row → `/meetings/:id`

> Add `settled boolean default false` to meetings table.

---

## Coding Conventions

- All components are function components with TypeScript, no class components
- No `any` types. Use proper interfaces.
- Data fetching: inline `useEffect` + `useState` per page (no SWR/React Query — keep it simple)
- Loading state: show skeleton or spinner; never render stale empty content
- Error state: show error message in red, retry button if appropriate
- Dates stored as ISO strings. Display in KST. Use `new Date(str).toLocaleDateString('ko-KR')` for display.
- Birthday format `YYMMDD` stays as string in DB; display as `MM월 DD일`
- All Korean text for UI labels (buttons, headers, placeholders) — this is a Korean-user product
- No comments in code unless the logic is genuinely non-obvious
- No barrel `index.ts` re-exports — import directly from the file
- Page components are thin: just layout + data fetching. Extract non-trivial logic to hooks or lib functions.

---

## File Naming

| Thing | Convention |
|---|---|
| React components | PascalCase.tsx |
| Hooks | camelCase.ts starting with `use` |
| Lib/util | camelCase.ts |
| Store | camelCase with `Store` suffix |
| Types | index.ts (all in one file) |

---

## What NOT to do

- Do not use `App.css` or the default Vite boilerplate styles — replace them
- Do not use Supabase Auth — auth is custom (name + code + User-Agent)
- Do not add React Query, SWR, Axios — plain fetch via supabase-js is enough
- Do not add animation libraries — Tailwind transitions only
- Do not create a separate mobile component for each page — reuse the same page component in both layouts
- Do not use `localStorage` for auth session — use `sessionStorage` (session-scoped login)
- Do not add a light/dark theme toggle — dark only
- Do not use emoji in UI chrome — use `lucide-react` icons (emoji only allowed inside user-authored DB content)
- Do not cap list/table/dashboard pages with a narrow `max-w-*` on PC — fill the width; narrow columns are only for focused forms
- Do not let the page scroll horizontally on mobile — convert wide tables to stacked cards via `useIsMobile()`
- Do not re-detect mobile by `window.innerWidth` inside pages — read `useIsMobile()` (route-based)
- Do not write any KakaoTalk bot logic — that's a separate system
