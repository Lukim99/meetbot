# scaffold-page

새 페이지를 프로젝트 컨벤션에 맞게 생성한다.

Usage: /scaffold-page <PageName> <route>
Example: /scaffold-page Ranking /ranking

## Instructions

$ARGUMENTS 를 파싱한다:
- 첫 번째 토큰 = PageName (PascalCase 컴포넌트 이름, 예: `Ranking`)
- 두 번째 토큰 = route (예: `/ranking`)

아래 작업을 순서대로 수행한다.

### 1. 페이지 파일 생성

`src/pages/<PageName>.tsx` 를 생성한다. 내용은 아래 템플릿을 따른다:

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useIsMobile } from '../hooks/useIsMobile'

// TODO: 실제 데이터 타입으로 교체
type Row = Record<string, unknown>

export default function <PageName>() {
  const isMobile = useIsMobile()
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: 실제 쿼리로 교체
    supabase
      .from('users')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setData(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="px-4 py-6 md:px-8 text-[--color-text-muted] text-sm">불러오는 중...</div>
  if (error) return <div className="px-4 py-6 md:px-8 text-red-400 text-sm">오류: {error}</div>

  return (
    <div className="w-full px-4 py-6 md:px-8">
      <h1 className="text-lg font-semibold text-[--color-text] mb-4"><PageName></h1>
      {/* TODO: 실제 UI 구현. isMobile 이면 카드 리스트, 아니면 테이블/그리드 */}
    </div>
  )
}
```

- `<PageName>` 자리에 실제 컴포넌트 이름을 넣는다.
- `h1` 텍스트는 한국어로 적절히 바꾼다 (CLAUDE.md의 페이지 스펙 참고).
- 반응형 규칙 준수 (CLAUDE.md의 Responsive Layout): PC는 `w-full`로 폭을 채우고 그리드/테이블 사용, 모바일은 `isMobile`로 카드 리스트 전환. 좁은 `max-w-*` 캡은 폼 전용.
- 이모지 금지. 아이콘이 필요하면 `lucide-react`에서 가져온다 (CLAUDE.md의 Icons & Emoji).

### 2. 라우터 등록

`src/router/index.tsx` 를 열고 PC 라우트와 `/m` 모바일 라우트 두 곳에 새 route를 추가한다.

- PC: `{ path: '<route>', element: <<PageName> /> }` — PCLayout 하위에 추가
- Mobile: `{ path: '/m<route>', element: <<PageName> /> }` — MobileLayout 하위에 추가
- import 구문도 상단에 추가

### 3. 네비게이션 등록

`src/components/layout/PCLayout.tsx` 와 `src/components/layout/MobileLayout.tsx` 를 열고, 새 페이지에 맞는 nav 항목을 추가한다. CLAUDE.md의 레이아웃 명세를 따른다. 아이콘은 `lucide-react` 에서 가장 적합한 것을 선택한다.

### 4. 완료 보고

생성/수정한 파일 경로 목록을 출력한다.
