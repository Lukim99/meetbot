# CLAUDE.md — KakaoTalk + Web User/Meeting Management System

## Project Purpose

A web application that surfaces data collected by a KakaoTalk bot (entry/exit events, nickname changes, message counts) stored in Supabase. The web app lets users view stats and manage their profiles, and lets admins manage welcome messages, auto-reply commands, group settlements, and title assignments.

**KakaoTalk bot is out of scope.** It writes to Supabase; this app only reads/writes via the Supabase JS client.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite + React 19 + TypeScript | already scaffolded |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | CSS-first config, no tailwind.config.js |
| Routing | `react-router-dom` v7 | `/m/*` for mobile, bare paths for PC |
| State | `zustand` | auth store only |
| Backend | `@supabase/supabase-js` v2 | Supabase hosted |
| Icons | `lucide-react` | consistent icon set |
| React Compiler | already enabled via babel preset | keep as-is |

**vite.config.ts** — plugins: `react()`, `babel({ presets: [reactCompilerPreset()] })`, `tailwindcss()`

**src/index.css** — actual current theme:
```css
@import "tailwindcss";

@theme {
  --color-accent:     #818cf8;
  --color-accent-dim: #6366f1;
  --color-bg:         #0f1117;
  --color-surface:    #161a26;
  --color-surface-2:  #1e2336;
  --color-border:        #191c23;
  --color-border-strong: #232730;
  --color-text:       #dce4f5;
  --color-text-muted: #6b7899;
}

body {
  font-family: 'Pretendard Variable', 'Pretendard', -apple-system, system-ui, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  font-size: 14px;
}
```

---

## Design System

### Colors (always use these CSS variables)

| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#818cf8` | primary buttons, active states, badges, highlights |
| `--color-accent-dim` | `#6366f1` | gradient end / hover state |
| `--color-bg` | `#0f1117` | page background |
| `--color-surface` | `#161a26` | cards, sidebar, modals |
| `--color-surface-2` | `#1e2336` | inputs, table rows, nested surfaces |
| `--color-border` | `#191c23` | all borders / dividers / hairlines (very dark, near-bg) |
| `--color-border-strong` | `#232730` | hover / selected / emphasized borders |
| `--color-text` | `#dce4f5` | primary text |
| `--color-text-muted` | `#6b7899` | secondary text, labels, placeholders |

**Rule:** Very dark background everywhere. No light mode. Accent (#818cf8) is bright indigo — use it sparingly. Borders should feel nearly invisible but stay a neutral dark gray — never a white tint (white-on-dark hairlines read as harsh/glary). Always use `border-[--color-border]` (or `var(--color-border)` inline) for dividers, and `--color-border-strong` for hover/selected emphasis. Do NOT use `border-white/[...]` or `rgba(255,255,255,...)` for lines.

**CSS variable + background caveat:** `bg-[--color-accent]` may not generate CSS reliably in all Tailwind v4 build configurations. For critical background fills (e.g. today's date circle), prefer `style={{ backgroundColor: 'var(--color-accent)' }}` inline. Text/border/ring classes using CSS vars are fine.

### Typography
- Font: Pretendard Variable (loaded via CSS; falls back to system-ui)
- Base size: 14px (Tailwind `text-sm`)
- Headings: `text-xl font-bold` for page titles, `text-base font-semibold` for section titles
- Muted labels: `text-xs text-[--color-text-muted]`

### Spacing & Shape
- Card border radius: `rounded-xl` (12px)
- Input/button border radius: `rounded-lg` (8px)
- Consistent padding inside cards: `p-4` or `p-5`
- Sidebar width (PC): `w-56` (224px)

### Icons & Emoji

**Use icons, not emoji.** A clean, modern, refined look comes from a consistent monochrome icon set.

- All icons come from `lucide-react`. One library, one visual language.
- Default icon size: `size={16}` inline with text, `size={20}` for nav/standalone.
- Icon color follows text: `text-[--color-text-muted]` by default, `text-[--color-accent]` when active.
- **Do not use emoji in UI chrome.** Replace with lucide icons:
  - rank/medal → `Medal`, `Crown`, `Trophy`
  - success → `Check` / `CheckCircle2`
  - warning/error → `AlertTriangle` / `XCircle`
  - empty state → a single muted lucide icon (e.g. `Inbox`, `CalendarDays`)
- Emoji only allowed in user-authored content stored in DB.
- Icons must always have a text label or `aria-label`.

### Component Patterns (`src/components/ui/`)

**Button:**
- Variant `primary`: gradient `from-[#818cf8] to-[#6366f1]`, `text-white font-semibold`, glow shadow, `hover:brightness-[1.07]`
- Variant `ghost`: `bg-white/[.04] border border-white/10 text-[--color-text] hover:bg-white/[.08] hover:border-white/[.18]`
- Variant `danger`: `bg-red-500/[.08] border border-red-500/25 text-red-400 hover:bg-red-500/[.14]`
- All buttons: `rounded-lg px-4 py-2 text-sm transition-all cursor-pointer disabled:opacity-40`

**Input:**
- `bg-[--color-surface-2] border border-white/[.07] rounded-lg px-3 py-2.5 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-accent] focus:ring-2 focus:ring-[--color-accent]/[.12] transition-all w-full`

**Card:**
- `bg-[--color-surface] border border-white/[.06] rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.35)]`

**Badge:**
- Accent: `bg-[--color-accent]/10 text-[--color-accent] border border-[--color-accent]/20 rounded-full px-2 py-0.5 text-xs font-medium`
- Neutral: `bg-[--color-surface-2] text-[--color-text-muted] rounded-full px-2 py-0.5 text-xs`
- Warning: `bg-orange-500/10 text-orange-400 border border-orange-500/20 ...`
- Success: `bg-green-500/10 text-green-400 border border-green-500/20 ...`

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
│   ├── auth.ts           # login(), logout() helpers
│   ├── format.ts         # formatDate, formatDateTime, formatBirthday
│   ├── cn.ts             # clsx/twMerge helper
│   └── layoutContext.ts  # LayoutContext for isMobile
├── store/
│   └── authStore.ts      # zustand store: { user, setUser, clear }
├── types/
│   └── index.ts          # All TypeScript types
├── hooks/
│   ├── useAuth.ts        # reads authStore, exposes isAdmin, isOwner
│   ├── useUser.ts        # fetch single user by id
│   └── useIsMobile.ts    # reads LayoutContext; true under /m/* layout
├── components/
│   ├── layout/
│   │   ├── PCLayout.tsx      # sidebar + main wrapper
│   │   ├── MobileLayout.tsx  # bottom tab bar wrapper
│   │   ├── RequireAuth.tsx   # redirect to /login if not authed
│   │   ├── RequireAdmin.tsx  # redirect if not admin
│   │   └── nav.ts            # NAV_ITEMS array + toPath()
│   └── ui/
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Page.tsx          # Page + PageHeader wrappers
│       ├── States.tsx        # Loading, ErrorState, EmptyState
│       ├── Table.tsx
│       └── Tabs.tsx
├── pages/
│   ├── Login.tsx
│   ├── Ranking.tsx
│   ├── Members.tsx
│   ├── MemberDetail.tsx
│   ├── MbtiList.tsx
│   ├── Profile.tsx
│   ├── Meetings.tsx          # calendar view + day slide panel
│   ├── MeetingDetail.tsx
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── WelcomeMsg.tsx
│       ├── Commands.tsx
│       ├── Settlements.tsx
│       └── Titles.tsx        # title CRUD (admin only)
└── router/
    └── index.tsx
```

---

## TypeScript Types (`src/types/index.ts`)

```ts
export interface LogEntry { date: string; name: string }
export interface LogExit { date: string; name: string; cause: '나가기' | '강퇴'; kicked_by: string | null }
export interface LogChangeName { date: string; old_name: string; new_name: string }
export interface UserLogs { entry: LogEntry[]; exit: LogExit[]; change_name: LogChangeName[] }

export interface User {
  id: string
  name: string              // handle (login ID, no @)
  kakao_name: string        // display name from KakaoTalk
  code: string
  logged_in: string[]
  logged_in_agent: string[]
  birthday: string          // "YYMMDD"
  chat_count: number
  logs: UserLogs
  permission: number[]      // PERM_OWNER=1, PERM_ADMIN=2
  titles: string[]          // title names assigned to user
  title: string             // currently active title
  mbti: string | null
  profile_image: string | null
  exp: number
  level: number
  attend_at: string | null
  point: number
  created_at: string
  updated_at: string
}

export interface TitleItem {
  id: string
  name: string
  created_at: string
}

export interface Meeting {
  id: string
  name: string
  date: string              // ISO date "YYYY-MM-DD"
  description: string | null
  created_by: string        // user id
  settled: boolean
  created_at: string
}

export interface MeetingMember { meeting_id: string; user_id: string }

export interface MeetingItem {
  id: string
  meeting_id: string
  label: string
  amount: number
  payer_id: string | null
}

export interface Command {
  id: string
  trigger: string
  response_text: string | null
  image_url: string | null
}

export interface WelcomeMessage {
  id: number
  text: string | null
  image_url: string | null
}

export const PERM_OWNER = 1
export const PERM_ADMIN = 2

export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const
```

---

## Supabase Schema

```sql
create table users (
  id text primary key,
  name text not null,           -- handle
  kakao_name text default '',   -- display name
  code text not null,
  logged_in text[] default '{}',
  logged_in_agent text[] default '{}',
  birthday text default '',
  chat_count integer default 0,
  logs jsonb default '{"entry":[],"exit":[],"change_name":[]}',
  permission integer[] default '{}',
  titles text[] default '{}',
  title text default '',
  mbti text,
  profile_image text,
  exp integer default 0,
  level integer default 1,
  attend_at timestamptz,
  point integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table titles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  description text,
  created_by text references users(id),
  settled boolean default false,
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

---

## Auth Flow

```
login(name: string, code?: string) → User | AuthError

1. Query users WHERE name = $name
2. No user → throw "유저를 찾을 수 없습니다"
3. Check navigator.userAgent against user.logged_in_agent
4. UA match → login success (no code needed)
5. No code provided → throw NeedCodeError
6. code !== user.code → throw "코드가 올바르지 않습니다"
7. Else → append UA to logged_in_agent (UPDATE) → login success
8. On success: save user to zustand authStore, save user.id to sessionStorage
```

**Session persistence:** On app load, read `sessionStorage.getItem('uid')`, re-fetch user, restore authStore. Failure → redirect to login.

**Permission checks:**
- `isOwner`: `user.permission.includes(PERM_OWNER)` (1)
- `isAdmin`: `user.permission.includes(PERM_ADMIN)` (2) — owners are NOT automatically admins unless they also have permission 2
- `useAuth()` hook exposes both flags

**Login input:** The name field shows `@` prefix visually (positioned absolutely) but passes the value without `@` to `login()`. Only Korean, English, digits, `_`, `.` are allowed.

---

## Routing (`src/router/index.tsx`)

```
/ → redirect to /ranking or /m/ranking (auto-detect mobile)
/login, /m/login → Login (no layout)

PC routes (PCLayout > RequireAuth):
  /ranking, /members, /members/:id, /profile
  /meetings, /meetings/:id
  /admin, /admin/welcome, /admin/commands, /admin/settlements, /admin/titles (RequireAdmin)

Mobile routes (/m prefix, MobileLayout > RequireAuth):
  same paths prefixed with /m/
```

---

## Layout Components

Both layouts provide `LayoutContext.Provider` with `{ isMobile }`. Pages read it via `useIsMobile()`.

### PCLayout — sidebar + main

```
┌──────────────────────────────────────────────┐
│ Sidebar (w-56)  │  <main> (flex-1)           │
│  Logo           │                            │
│  Nav items      │   <Outlet />               │
│  ─ (admin only) │                            │
│  Admin items    │                            │
│  ─────────────  │                            │
│  User card      │                            │
└──────────────────────────────────────────────┘
```

Nav items:
- 랭킹 (`Trophy`) → `/ranking`
- 멤버 (`Users`) → `/members`
- 일정 (`CalendarDays`) → `/meetings`
- 내 프로필 (`User`) → `/profile`
- ─── admin divider ───
- 관리 (`ShieldCheck`) → `/admin`

Active nav: `bg-[--color-surface-2] text-[--color-text] font-medium`

Sidebar user card (bottom): profile image + level + handle + logout button. Owner badge = red crown, Admin badge = blue crown.

### MobileLayout — bottom tab bar

```
┌─────────────────────────────┐
│     <Outlet />              │
├─────────────────────────────┤
│ 랭킹 │ 멤버 │ 일정 │ 나  │ (관리) │
└─────────────────────────────┘
```

Tab bar: `fixed bottom-0 z-40 bg-[--color-surface]/95 backdrop-blur-md border-t border-[--color-border]`
Active tab: `text-[--color-accent]` with pill background. Inactive: `text-[--color-text-muted]`.
`내 프로필` label is shortened to `나` in tab bar.

---

## Responsive Layout

Split by route (`/m/*`), not by screen width. Pages read `useIsMobile()` for structural markup differences (table vs. card list).

**PC:** Fill the full width. No `max-w-*` cap on list/table/dashboard pages. Multi-column grids scale with screen width.

**Mobile:** Single-column. Replace tables with card lists. `pb-20` on content to clear the fixed tab bar. Long text uses `truncate` with `min-w-0` on flex children. Horizontal-scrollable chip rows use `flex overflow-x-auto shrink-0`.

---

## Page Specifications

### Login (`/login`, `/m/login`)

- Name input with `@` prefix (visual only — value stored/sent without `@`)
- Input validation: Korean, English, digits, `_`, `.` only
- Step 1: name → Step 2: code (if UA not recognized)
- Full-page centered card, no layout wrapper

### 일정 (`/meetings`, `/m/meetings`)

**Calendar view** (not a card list):
- Monthly grid, 6×7, Sunday-first
- Month navigator: `< 2025년 6월 >`
- Each date is a standalone button (no grid borders)
- Today: accent-colored filled circle; use `style={{ backgroundColor: 'var(--color-accent)' }}` for the fill (not `bg-[--color-accent]` Tailwind class, which can be unreliable) + `text-white`
- Selected date: `border-2 border-[--color-accent] text-[--color-accent]` circle
- Other-month dates: `opacity-20` on the whole cell
- Meeting indicators: small accent dots below the number

**Day slide panel** (opens on date click):
- PC: `fixed right-0 top-0 h-full w-88` sliding in from right (`translate-x-full → translate-x-0`)
- Mobile: `fixed bottom-0 inset-x-0 max-h-82vh` sliding up from bottom
- Shows meetings for that date + "이 날 일정 추가" button
- Toggle: clicking the same date closes the panel

**Create modal** (opens from header button or panel button):
- Accent gradient strip at top
- Fields: 일정 이름 (required), 날짜 (pre-filled from selected date), 설명 (optional)

### MemberDetail (`/members/:id`, `/m/members/:id`)

Admin section — **칭호 관리** card:
- **보유 칭호**: each title chip shows a `Crown` icon (accent if active, dimmed if not). Clicking name/icon sets as active title. `×` button removes.
- **추가 가능한 칭호**: dashed-border chips loaded from `titles` table. Click to add instantly (no dropdown).

### AdminDashboard (`/admin`, `/m/admin`)

Stat cards: 총 유저 수, 오늘 입장, 총 채팅 수, 전체 일정 수

Quick nav: 입장 메시지 설정, 명령어 관리, 모임 정산, **칭호 관리** → `/admin/titles`

### Settlements (`/admin/settlements`)

Column: 일정 이름 | 날짜 | 인원 | 총액 | 상태 (미정산/정산완료 toggle)

---

## Coding Conventions

- Function components + TypeScript only. No `any`.
- Data fetching: `useEffect` + `useState` per page. No SWR/React Query.
- Loading → spinner/skeleton. Error → red message + retry if helpful.
- Dates: ISO strings in DB, `toLocaleDateString('ko-KR')` for display.
- Birthday `YYMMDD` string → display as `MM월 DD일`.
- Korean UI text throughout.
- No code comments unless logic is genuinely non-obvious.
- No barrel `index.ts` re-exports.
- Page components are thin: layout + data fetch only.
- Use `sessionStorage` for auth (not `localStorage`).

---

## What NOT to do

- Do not use Supabase Auth — custom auth (name + code + User-Agent)
- Do not add React Query, SWR, or Axios
- Do not add animation libraries — Tailwind transitions only
- Do not add a light/dark theme toggle — dark only
- Do not use emoji in UI chrome
- Do not cap list/dashboard pages with `max-w-*` on PC
- Do not re-detect mobile by `window.innerWidth` inside pages — use `useIsMobile()`
- Do not write KakaoTalk bot logic
- Do not use `bg-[--color-accent]` for critical backgrounds — use inline `style` with `var(--color-accent)` instead
