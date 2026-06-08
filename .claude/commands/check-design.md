# check-design

현재 작업 중인 파일(또는 지정한 경로)의 코드가 디자인 시스템을 올바르게 따르는지 검사한다.

Usage: /check-design [파일경로 또는 glob]
Example: /check-design src/pages/Ranking.tsx
Example: /check-design src/pages/

## Instructions

$ARGUMENTS 가 비어 있으면 `src/` 전체를 대상으로 한다. 경로가 주어지면 그 파일/디렉터리만 검사한다.

### 검사 항목

아래 위반 사항을 grep/read로 찾아서 위반 목록을 출력한다.

#### 1. 금지된 색상 하드코딩

아래 패턴이 tsx/css 파일에 있으면 위반:
- `#0f0f0f`, `#1a1a1a`, `#242424`, `#2e2e2e`, `#f0f0f0`, `#888888` 를 Tailwind 클래스 문자열 안에서 CSS 변수 없이 직접 사용
- `#00FFBF`, `#00cc99` 를 CSS 변수(`--color-accent`) 대신 직접 사용
- `text-white`, `bg-white`, `text-black`(버튼 variant primary의 `text-black` 제외), `bg-gray-*`, `text-gray-*` 사용

올바른 패턴 예시:
```
bg-[--color-surface]   (OK)
text-[--color-accent]  (OK)
bg-[#1a1a1a]           (위반) → bg-[--color-surface] 로 교체
text-gray-400          (위반) → text-[--color-text-muted] 로 교체
```

#### 2. 일관성 없는 border-radius

- 카드/모달에 `rounded-xl` 이 아닌 `rounded` / `rounded-md` / `rounded-2xl` 사용
- 버튼/입력에 `rounded-lg` 이 아닌 다른 radius 사용

#### 3. 외부 상태 관리 라이브러리 사용

- `react-query`, `swr`, `@tanstack/react-query` import 감지 → 사용 금지

#### 4. 인증 로직 오류

- `localStorage` 에 `uid` 또는 유저 정보 저장 → `sessionStorage` 로 교체해야 함
- Supabase Auth (`supabase.auth.*`) 호출 감지 → 이 프로젝트는 custom auth만 사용

#### 5. `any` 타입 사용

- `: any` 또는 `as any` 패턴 감지

#### 6. 주석 과다

- 3줄 이상 연속 주석 블록 (`//` 또는 `/* */`) 감지 — CLAUDE.md 컨벤션 위반

#### 7. UI에 이모지 사용 (아이콘으로 교체)

- tsx 파일의 JSX 텍스트·문자열 리터럴 안에서 이모지 문자 감지 → 위반
- 흔한 위반: 🥇🥈🥉🎉✅❌⚠️🔥👍💬📌⭐ 등. 유니코드 이모지 범위(U+1F300–U+1FAFF, U+2600–U+27BF, 변형 선택자 U+FE0F)를 포함한 문자열을 찾는다.
- 교체 지침: `lucide-react` 아이콘으로 대체 (메달→`Medal`, 성공→`Check`, 경고→`AlertTriangle`). CLAUDE.md의 Icons & Emoji 매핑 참고.
- **예외**: Supabase에서 불러온 유저 작성 콘텐츠(닉네임, welcome message 등)를 단순 렌더링하는 경우는 위반 아님. 하드코딩된 문자열 리터럴만 위반으로 본다.

#### 8. 반응형 레이아웃 위반

- **PC 폭 낭비**: 목록/테이블/대시보드 페이지(pages/) 루트 컨테이너에 `max-w-md`/`max-w-lg`/`max-w-2xl` 등 좁은 캡 사용 → 위반 (Login·Profile 폼은 예외)
- **모바일 가로 스크롤 유발**: 페이지 루트에 `overflow-x-auto`/고정 `w-[...px]`/`whitespace-nowrap` 가 테이블 외 영역에 사용 → 위반
- **truncate 오작동**: `truncate` 가 있는데 같은 flex row의 텍스트 자식 또는 부모에 `min-w-0` 가 없으면 → 경고
- **고정폭 이미지**: `<img>` 에 `max-w-full h-auto` 누락 → 경고
- **width 직접 감지**: 페이지 컴포넌트 안에서 `window.innerWidth` 사용 → 위반 (`useIsMobile()` 사용해야 함)

### 출력 형식

```
[check-design 결과]

통과: <통과 항목 수>개 항목
위반: <위반 수>건

위반 목록:
- src/pages/Ranking.tsx:34 — [색상] bg-[#1a1a1a] → bg-[--color-surface]
- src/pages/Members.tsx:12 — [타입] any 사용: const data: any[]
- src/pages/Ranking.tsx:50 — [이모지] "🥇" → lucide <Medal /> 로 교체
- src/pages/Members.tsx:8 — [반응형] 목록 페이지에 max-w-lg 캡 → w-full 로 교체
...

수정 제안을 적용할까요?
```

위반이 발견되면 수정 여부를 물어본 뒤, 승인 시 해당 파일들을 직접 수정한다.
