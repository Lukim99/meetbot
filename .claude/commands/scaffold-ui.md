# scaffold-ui

디자인 시스템에 맞는 공통 UI 컴포넌트를 생성한다.

Usage: /scaffold-ui <ComponentName>
Example: /scaffold-ui Modal

## Instructions

$ARGUMENTS = 컴포넌트 이름 (PascalCase, 예: `Modal`, `Tabs`, `Avatar`)

### 규칙

CLAUDE.md의 Design System 섹션을 반드시 준수한다:

| 요소 | 규칙 |
|---|---|
| 배경 | `bg-[--color-surface]` (카드/모달) 또는 `bg-[--color-surface-2]` (입력/중첩) |
| 테두리 | `border border-[--color-border] rounded-xl` (카드) / `rounded-lg` (입력·버튼) |
| 텍스트 | `text-[--color-text]` 기본, `text-[--color-text-muted]` 보조 |
| 강조 | `text-[--color-accent]` 또는 `bg-[--color-accent]` — 반드시 accent만 사용 |
| 트랜지션 | `transition-colors` (Tailwind transition만, 애니메이션 라이브러리 금지) |
| 아이콘 | `lucide-react`만 사용 (이모지 금지). 인라인 `size={18}`, 단독 `size={20}`. 색은 텍스트 색을 따른다 |
| 반응형 | 텍스트 자식에 `min-w-0`+`truncate`로 오버플로 방지, 모바일에서 버튼 라벨 줄바꿈 금지 |

### 컴포넌트별 추가 규칙

- **Modal**: 오버레이 `bg-black/60`, 내부 카드 `bg-[--color-surface] rounded-xl p-6 w-full max-w-md`
- **Tabs**: 탭 버튼 active = `border-b-2 border-[--color-accent] text-[--color-accent]`, inactive = `text-[--color-text-muted]`
- **Avatar**: 원형, 이니셜(이름 첫 글자), `bg-[--color-accent]/20 text-[--color-accent] rounded-full flex items-center justify-center font-semibold`
- **Select/Dropdown**: Input과 동일한 스타일 + 드롭다운 `bg-[--color-surface] border border-[--color-border] rounded-lg`
- **Spinner**: `border-2 border-[--color-border] border-t-[--color-accent] rounded-full animate-spin`
- **기타**: 위 규칙 중 가장 유사한 패턴을 따른다

### 생성 위치

`src/components/ui/<ComponentName>.tsx`

### Props 설계 원칙

- 필요한 props만 선언, optional은 `?`로
- children을 받는 경우 `React.ReactNode` 타입 사용
- 콜백은 `() => void` 또는 `(value: T) => void` 형태
- className override prop은 추가하지 않는다 (일관성 유지)

### 완료 후

생성된 파일 경로와 주요 props 목록을 출력한다.
