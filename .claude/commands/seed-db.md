# seed-db

Supabase에 개발용 더미 데이터를 삽입하는 SQL을 생성한다. 실행은 사용자가 Supabase SQL Editor에서 직접 한다.

Usage: /seed-db [옵션]
Example: /seed-db
Example: /seed-db --users 20 --meetings 5

## Instructions

$ARGUMENTS 파싱:
- `--users N` : 생성할 유저 수 (기본 10)
- `--meetings N` : 생성할 모임 수 (기본 3)

### 생성할 SQL 내용

#### users 테이블

현실적인 한국어 이름으로 N명의 유저를 생성한다.

- `id`: 8자리 랜덤 문자열 (카카오톡 유저 ID 형식 모방)
- `name`: 실제 한국 이름 (예: 김민준, 이서연, 박지호 등)
- `code`: 6자리 숫자 문자열
- `logged_in`: 빈 배열
- `logged_in_agent`: 개발용 UA 1개 포함 (`'Mozilla/5.0 (dev)'`)
- `birthday`: YYMMDD 형식 랜덤 (900101 ~ 051231 범위)
- `chat_count`: 0 ~ 5000 랜덤
- `logs`: `{"entry": [{"date": "...", "name": "..."}], "exit": [], "change_name": []}` — 입장 로그 1개
- `permission`: 첫 번째 유저만 `{0}` (관리자), 나머지 `{}`
- `titles`: 별명 1~2개 랜덤 (예: `{닉네임1}`, `{닉네임1,닉네임2}`)
- `title`: titles[0]
- `mbti`: 16개 MBTI 중 랜덤

**중요**: `DELETE FROM users;` 를 먼저 실행하지 않는다. UPSERT 형태(`ON CONFLICT (id) DO NOTHING`)로 작성한다.

#### meetings 테이블

N개의 모임 생성:
- `id`: gen_random_uuid() 호출
- `name`: 현실적인 모임 이름 (예: '6월 번개 모임', '분기 정산', '생일파티')
- `date`: 최근 2개월 내 랜덤 날짜
- `description`: 간단한 설명 or null
- `created_by`: 위에서 생성한 유저 중 하나의 id
- `settled`: false

#### meeting_members 테이블

각 모임에 3~6명의 멤버 삽입 (위에서 생성한 유저 id 활용)

#### welcome_message

```sql
INSERT INTO welcome_message (id, text, image_url)
VALUES (1, '안녕하세요! 채팅방에 오신 것을 환영합니다.', null)
ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text;
```

#### commands

자동응답 예시 3개:
- `!도움말` → 도움말 텍스트
- `!랭킹` → 랭킹 확인 안내
- `!정보` → 봇 정보 안내

### 출력 형식

전체 SQL을 코드 블록으로 출력한다.

```sql
-- seed.sql (Supabase SQL Editor에 붙여넣기)
-- 생성: users 10명, meetings 3개

INSERT INTO users (...) VALUES ...;
...
```

SQL 블록 출력 후: "위 SQL을 Supabase 대시보드 → SQL Editor에 붙여넣고 실행하세요." 라고 안내한다.
