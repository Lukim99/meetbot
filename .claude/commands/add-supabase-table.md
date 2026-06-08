# add-supabase-table

새 Supabase 테이블에 대응하는 SQL, TypeScript 타입, 기본 훅을 한 번에 생성한다.

Usage: /add-supabase-table <테이블명> <컬럼 정의...>
Example: /add-supabase-table announcements "id uuid pk" "title text" "body text" "created_at timestamptz"

## Instructions

$ARGUMENTS 파싱:
- 첫 토큰 = 테이블명 (snake_case)
- 나머지 토큰들 = `"컬럼명 타입 [pk|null|default값]"` 형태의 컬럼 정의

### 1. SQL 출력

아래 형태의 CREATE TABLE SQL을 출력한다 (실행은 하지 않음, 사용자가 Supabase 대시보드에 붙여넣기):

```sql
create table <테이블명> (
  -- 파싱된 컬럼들
  created_at timestamptz default now()  -- 없으면 자동 추가
);
```

- uuid pk 컬럼은 자동으로 `default gen_random_uuid()` 추가
- `references users(id)` 패턴은 인자에 `ref:users` 형태로 지정 시 추가
- 항상 `created_at` 이 없으면 자동 추가

### 2. TypeScript 인터페이스

`src/types/index.ts` 를 열고 기존 타입 목록 하단에 새 인터페이스를 추가한다:

```ts
export interface <PascalCaseTableName> {
  // 컬럼별 적절한 TS 타입 매핑
  // uuid → string, text → string, integer → number,
  // boolean → boolean, timestamptz → string, jsonb → unknown
  // null 가능 컬럼은 | null
}
```

### 3. 기본 fetch 훅

`src/hooks/use<PascalCaseTableName>List.ts` 를 생성한다:

```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { <PascalCaseTableName> } from '../types'

export function use<PascalCaseTableName>List() {
  const [data, setData] = useState<<PascalCaseTableName>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('<테이블명>')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setData(data ?? [])
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}
```

### 4. 완료 보고

- SQL (콘솔 출력용)
- 수정된 파일: `src/types/index.ts`
- 생성된 파일: `src/hooks/use<PascalCaseTableName>List.ts`
